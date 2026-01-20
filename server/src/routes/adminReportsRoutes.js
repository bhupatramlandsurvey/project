const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const RequestMapOrder = require("../models/RequestMapOrder");
const LandSurveyOrder = require("../models/LandSurveyOrder");
const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const User = require("../models/User");

/** Utils */
const parseDate = (v, def) => (v ? new Date(v) : def);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Build a unified aggregation pipeline for all order collections */
function unifiedOrdersPipeline({ from, to, extraMatch = {} } = {}) {
  const dateFrom = startOfDay(parseDate(from, new Date(Date.now() - 30 * 864e5)));
  const dateTo = endOfDay(parseDate(to, new Date()));

  const baseProject = {
    _id: 1,
    amount: { $ifNull: ["$amount", 0] },
    status: 1,
    createdAt: {
      $ifNull: ["$createdAt", { $ifNull: ["$dateTime", "$createdAt"] }],
    },
    orderId: { $ifNull: ["$orderId", "$friendlyId"] },
    friendlyId: { $ifNull: ["$friendlyId", "$orderId"] },
    user: 1,
    userId: 1,
    assignedTo: 1,
    files: { $ifNull: ["$files", "$uploadedFiles"] },
  };

  const matchStage = {
    $match: {
      $and: [
        { $or: [{ createdAt: { $gte: dateFrom, $lte: dateTo } }, { dateTime: { $gte: dateFrom, $lte: dateTo } }] },
        extraMatch,
      ],
    },
  };

  // Each branch normalizes to the same shape and adds a "type"
  const first = [
    matchStage,
    { $project: { ...baseProject, type: { $literal: "Download Maps" } } },
  ];

  const unionWith = (collName, proj, match = matchStage) => ({
    $unionWith: {
      coll: mongoose.connection.collection(collName).collectionName,
      pipeline: [match, { $project: proj }],
    },
  });

  const common = (typeLiteral) => ({ ...baseProject, type: { $literal: typeLiteral } });

  return [
    ...first,
    unionWith(FTLOrder.collection.name, common("FTL Hydra")),
    unionWith(HMDAOrder.collection.name, common("HMDA Masterplan")),
    unionWith(TopoOrder.collection.name, common("TOPO Sheet")),
    unionWith(RequestMapOrder.collection.name, common("Request Services")),
    unionWith(LandSurveyOrder.collection.name, common("Land Survey")),
    // Final fallback for date field
    {
      $addFields: {
        createdAt: { $ifNull: ["$createdAt", "$dateTime"] },
      },
    },
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
  ];
}

/** Simple INR normalization:
 * If amount looks like paise (>= 1000), convert to INR.
 * Otherwise assume already INR.
 */
const normalizeAmountExpr = {
  $cond: [
    { $gte: ["$amount", 1000] },
    { $divide: ["$amount", 100] },
    "$amount",
  ],
};

/** ---- ROUTES ---- **/

// 1) Summary: totals for dashboard
router.get("/summary", async (req, res) => {
  try {
    const { from, to } = req.query;

    const pipeline = [
      ...unifiedOrdersPipeline({ from, to }),
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenueINR: { $sum: normalizeAmountExpr },
              },
            },
          ],
          byType: [
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $project: { _id: 0, type: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
        },
      },
      {
        $project: {
          totals: { $arrayElemAt: ["$totals", 0] },
          byType: 1,
          byStatus: 1,
        },
      },
    ];

    // 🧮 Aggregate unified orders data
    const data = await DownloadMapsAndFilesOrder.aggregate(pipeline);
    const summary = data[0] || { totals: {}, byType: [], byStatus: [] };

    // 👥 Count total users from User model
    const totalUsers = await User.countDocuments();

    // ✅ Send combined summary
    res.json({
      success: true,
      summary: {
        ...summary,
        usersCount: totalUsers,
      },
    });
  } catch (err) {
    console.error("❌ Reports Summary Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// 2) Sales report (trend) - group by day or month
router.get("/sales", async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;

    const dateFormat =
      groupBy === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } };

    const pipeline = [
      ...unifiedOrdersPipeline({ from, to }),
      {
        $group: {
          _id: dateFormat,
          revenueINR: { $sum: normalizeAmountExpr },
          count: { $sum: 1 },
        },
      },
      { $project: { date: "$_id", revenueINR: 1, count: 1, _id: 0 } },
      { $sort: { date: 1 } },
    ];

    const data = await DownloadMapsAndFilesOrder.aggregate(pipeline);
    res.json({ success: true, sales: data });
  } catch (err) {
    console.error("❌ Sales Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 3) Orders report (trend + by type/status)
router.get("/orders", async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;

    const dateFormat =
      groupBy === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } };

    const pipeline = [
      ...unifiedOrdersPipeline({ from, to }),
      {
        $facet: {
          trend: [
            { $group: { _id: dateFormat, count: { $sum: 1 } } },
            { $project: { date: "$_id", count: 1, _id: 0 } },
            { $sort: { date: 1 } },
          ],
          byType: [
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $project: { _id: 0, type: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ];

    const data = await DownloadMapsAndFilesOrder.aggregate(pipeline);
    const out = data[0] || { trend: [], byType: [], byStatus: [] };
    res.json({ success: true, ...out });
  } catch (err) {
    console.error("❌ Orders Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 4) Users report (growth + roles)
router.get("/users", async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;

    const dateFrom = startOfDay(parseDate(from, new Date(Date.now() - 30 * 864e5)));
    const dateTo = endOfDay(parseDate(to, new Date()));

    const dateFormat =
      groupBy === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } };

    const pipeline = [
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
      {
        $facet: {
          growth: [
            { $group: { _id: dateFormat, count: { $sum: 1 } } },
            { $project: { date: "$_id", count: 1, _id: 0 } },
            { $sort: { date: 1 } },
          ],
          byRole: [
            { $group: { _id: "$role", count: { $sum: 1 } } },
            { $project: { _id: 0, role: "$_id", count: 1 } },
          ],
          totals: [
            { $group: { _id: null, totalUsers: { $sum: 1 } } },
            { $project: { _id: 0, totalUsers: 1 } },
          ],
        },
      },
      {
        $project: {
          growth: 1,
          byRole: 1,
          totals: { $arrayElemAt: ["$totals", 0] },
        },
      },
    ];

    const data = await User.aggregate(pipeline);
    res.json({ success: true, users: data[0] || { growth: [], byRole: [], totals: { totalUsers: 0 } } });
  } catch (err) {
    console.error("❌ Users Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

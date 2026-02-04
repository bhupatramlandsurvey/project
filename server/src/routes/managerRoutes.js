const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const axios = require("axios");

/* ---------------- FAST2SMS CONFIG ---------------- */
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const SMS_SENDER_ID = "BLSOPC";
const ADMIN_REVIEW_TEMPLATE_ID = "207516";

// ✅ Admin mobile (keep in .env)
const ADMIN_MOBILE = process.env.ADMIN_MOBILE;

// Models
const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const RequestMapOrder = require("../models/RequestMapOrder");
const LandSurveyOrder = require("../models/LandSurveyOrder");
const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const ProcessedOrder = require("../models/ProcessedOrder");

// ✅ Multer Setup (for processed files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/processed"),

  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Unified Model Map
const modelMap = {
  "Download Maps": DownloadMapsAndFilesOrder,
  "Request Services": RequestMapOrder,
  "Land Survey": LandSurveyOrder,
  "FTL Hydra": FTLOrder,
  "HMDA Masterplan": HMDAOrder,
  "TOPO Sheet": TopoOrder,
};

/* ==========================================================
   1️⃣ Fetch ONLY unprocessed or admin-rejected orders
   ========================================================== */
/* ==========================================================
   1️⃣ Fetch only unprocessed or not approved orders for Manager
   ========================================================== */
router.get("/orders/:managerId", async (req, res) => {
  try {
    const { managerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid manager ID" });
    }

    const managerObjectId = new mongoose.Types.ObjectId(managerId);

    // ✅ Get processed orders for this manager
    const processedOrders = await ProcessedOrder.find({ managerId }).lean();

    // Approved processed orders to skip
    const approvedIds = processedOrders
      .filter((p) => /^approved$/i.test(p.status))
      .map((p) => p.orderId.toString());

    // Admin-rejected processed orders to include
    const rejectedProcessed = processedOrders.filter((p) =>
      /^rejected$/i.test(p.status)
    );

    console.log("🟢 Approved processed:", approvedIds.length);
    console.log("🔴 Admin rejected processed:", rejectedProcessed.length);

    // ✅ Allowed statuses to include from main models
    const allowedStatuses = [
      /^pending$/i,
      /^assigned$/i,
      /^processing$/i,
      /^rejected$/i,
      /^new$/i,
    ];

    const promises = Object.entries(modelMap).map(async ([type, Model]) => {
      // ✅ 1️⃣ Orders assigned to manager that are not approved
      const unprocessedOrders = await Model.find({
        assignedTo: managerObjectId,
        _id: { $nin: approvedIds }, // exclude already approved
        $or: allowedStatuses.map((regex) => ({ status: { $regex: regex } })),
      })
        .populate("user", "fullName mobile")
        .populate("assignedTo", "fullName mobile")
        .lean();

      // ✅ 2️⃣ Include admin-rejected processed orders (for re-upload)
      const adminRejected = await Promise.all(
        rejectedProcessed
          .filter((p) => p.type === type)
          .map(async (p) => {
            const order = await Model.findById(p.orderId)
              .populate("user", "fullName mobile")
              .populate("assignedTo", "fullName mobile")
              .lean();
            if (order)
              return {
                ...order,
                type,
                processedFiles: p.processedFiles,
                adminRejected: true,
              };
            return null;
          })
      );

      return [
        ...unprocessedOrders.map((o) => ({ ...o, type })),
        ...adminRejected.filter(Boolean),
      ];
    });

    const results = (await Promise.all(promises)).flat();

    const sorted = results.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(`✅ Total fetched for manager ${managerId}: ${sorted.length}`);
    res.json({ success: true, orders: sorted });
  } catch (err) {
    console.error("❌ Manager Fetch Orders Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ==================================================
   2️⃣ Update order (status + multiple file uploads)
   ================================================== */
/* ==================================================
   2️⃣ Update order (status + multiple file uploads)
   ================================================== */
router.put("/orders/:id", upload.array("processedFiles", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, managerId, reupload } = req.body;

    const Model = modelMap[type];
    if (!Model)
      return res
        .status(400)
        .json({ success: false, message: "Invalid order type" });

    // ✅ Build processed file list
    const processedFiles =
      req.files?.map((file) => ({
        url: `/uploads/processed/${file.filename}`,
        name: file.originalname,
        size: file.size,
      })) || [];

    // ✅ Fetch the order first
    const existingOrder = await Model.findById(id);
    if (!existingOrder)
      return res.status(404).json({ success: false, message: "Order not found" });

    // ✅ If this is a reupload (after admin rejection)
    if (reupload === "true" || reupload === true) {
      console.log("♻️ Manager reupload detected for order:", id);

      // 1️⃣ Reset any rejection flag
      existingOrder.adminRejected = false;
      existingOrder.status = "Reuploaded";

      // 2️⃣ Attach reuploaded files
      if (processedFiles.length > 0) {
        existingOrder.processedFiles.push(...processedFiles);
      }

      await existingOrder.save();

      // 3️⃣ Create new processed entry for admin to review again
      const reuploadEntry = new ProcessedOrder({
        orderId: existingOrder._id,
        orderRef: existingOrder.friendlyId || "",
        type,
        managerId,
        status: "Reuploaded",
        processedFiles,
        createdAt: new Date(),
      });
      await reuploadEntry.save();
// 📩 SMS to ADMIN for re-review
if (ADMIN_MOBILE) {
  try {
    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: "dlt",
        sender_id: SMS_SENDER_ID,
        message: ADMIN_REVIEW_TEMPLATE_ID, // 207516
        variables_values: existingOrder.friendlyId || "",
        flash: 0,
        numbers: ADMIN_MOBILE,
      },
    });
  } catch (smsErr) {
    console.error("📩 Admin Reupload SMS Failed:", smsErr.message);
  }
}

      return res.json({
        success: true,
        message: "Reuploaded successfully for admin review",
        order: existingOrder,
      });
    }

    // ✅ Normal first-time processing
    const updatedOrder = await Model.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
        $push: { processedFiles: { $each: processedFiles } },
      },
      { new: true, runValidators: false }
    );

    if (!updatedOrder)
      return res.status(404).json({ success: false, message: "Order not found" });

    // ✅ Create or update processed order entry
    const processedEntry = new ProcessedOrder({
      orderId: updatedOrder._id,
      orderRef: updatedOrder.friendlyId || "",
      type,
      managerId,
      status,
      processedFiles,
      createdAt: new Date(),
    });
    await processedEntry.save();
// 📩 SMS to ADMIN for review
if (ADMIN_MOBILE) {
  try {
    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: "dlt",
        sender_id: SMS_SENDER_ID,
        message: ADMIN_REVIEW_TEMPLATE_ID, // 207516
        variables_values: updatedOrder.friendlyId || "",
        flash: 0,
        numbers: ADMIN_MOBILE,
      },
    });
  } catch (smsErr) {
    console.error("📩 Admin Review SMS Failed:", smsErr.message);
  }
}

    res.json({
      success: true,
      message: "Order processed successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("❌ Manager Update Order Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* ===========================
   3️⃣ Delete order (optional)
   =========================== */
router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const Model = modelMap[type];
    if (!Model)
      return res
        .status(400)
        .json({ success: false, message: "Invalid order type" });

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Manager Delete Order Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

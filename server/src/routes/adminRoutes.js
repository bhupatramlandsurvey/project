const express = require("express");
const router = express.Router();
const axios = require("axios");

const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const RequestMapOrder = require("../models/RequestMapOrder");
const LandSurveyOrder = require("../models/LandSurveyOrder");
const User = require("../models/User");

/* ---------------- FAST2SMS CONFIG ---------------- */
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const SMS_SENDER_ID = "BLSOPC";
const COMPLETED_TEMPLATE_ID = "207153";
const ASSIGNED_TEMPLATE_ID = "207518";

/* =================================================
   1️⃣ GET ALL ORDERS (ADMIN)
   ================================================= */
router.get("/orders", async (req, res) => {
  try {
    const commonPopulate = [
      { path: "user", select: "fullName mobile" },
      { path: "assignedTo", select: "fullName mobile" },
    ];

    const [
      downloadMaps,
      ftl,
      hmda,
      topo,
      requestMap,
      landSurvey,
    ] = await Promise.all([
      DownloadMapsAndFilesOrder.find().populate(commonPopulate),
      FTLOrder.find().populate(commonPopulate),
      HMDAOrder.find().populate(commonPopulate),
      TopoOrder.find().populate(commonPopulate),
      RequestMapOrder.find().populate(commonPopulate),
      LandSurveyOrder.find().populate(commonPopulate),
    ]);

    const combined = [
      ...downloadMaps.map(o => ({ ...o.toObject(), type: "Download Maps" })),
      ...ftl.map(o => ({ ...o.toObject(), type: "FTL Hydra" })),
      ...hmda.map(o => ({ ...o.toObject(), type: "HMDA Masterplan" })),
      ...topo.map(o => ({ ...o.toObject(), type: "TOPO Sheet" })),
      ...requestMap.map(o => ({ ...o.toObject(), type: "Request Services" })),
      ...landSurvey.map(o => ({ ...o.toObject(), type: "Land Survey" })),
    ];

    res.json({ success: true, orders: combined.reverse() });
  } catch (err) {
    console.error("❌ Admin Fetch Orders Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* =================================================
   2️⃣ UPDATE ORDER STATUS / ASSIGN MANAGER
   ================================================= */
router.put("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, assignedTo, ...updates } = req.body;

    const modelMap = {
      "Download Maps": DownloadMapsAndFilesOrder,
      "FTL Hydra": FTLOrder,
      "HMDA Masterplan": HMDAOrder,
      "TOPO Sheet": TopoOrder,
      "Request Services": RequestMapOrder,
      "Land Survey": LandSurveyOrder,
    };

    const Model = modelMap[type];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    /* 🔍 FETCH EXISTING ORDER */
    const existingOrder = await Model.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const wasCompleted = existingOrder.status === "Completed";
    const oldManagerId = existingOrder.assignedTo?.toString();

    /* 🔄 UPDATE ORDER */
    const updatedOrder = await Model.findByIdAndUpdate(
      id,
      { status, assignedTo, ...updates },
      { new: true }
    ).populate([
      { path: "user", select: "fullName mobile" },
      { path: "assignedTo", select: "fullName mobile" },
    ]);

    /* 📩 SEND COMPLETION SMS */
    if (!wasCompleted && status === "Completed" && updatedOrder?.user?.mobile) {
      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: FAST2SMS_API_KEY,
            route: "dlt",
            sender_id: SMS_SENDER_ID,
            message: COMPLETED_TEMPLATE_ID,
            variables_values: updatedOrder.friendlyId || "",
            flash: 0,
            numbers: updatedOrder.user.mobile,
          },
        });
      } catch (err) {
        console.error("📩 Completion SMS Failed:", err.response?.data || err.message);
      }
    }

    /* 📩 SEND ASSIGNMENT SMS */
    if (
      assignedTo &&
      assignedTo !== oldManagerId
    ) {
      const manager = await User.findById(assignedTo).select("mobile fullName");

      if (manager?.mobile) {
        try {
          await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
              authorization: FAST2SMS_API_KEY,
              route: "dlt",
              sender_id: SMS_SENDER_ID,
              message: ASSIGNED_TEMPLATE_ID,
              variables_values: updatedOrder.friendlyId || "",
              flash: 0,
              numbers: manager.mobile,
            },
          });
        } catch (err) {
          console.error("📩 Assignment SMS Failed:", err.response?.data || err.message);
        }
      }
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("❌ Update Order Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   3️⃣ DELETE ORDER
   ================================================= */
router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const modelMap = {
      "Download Maps": DownloadMapsAndFilesOrder,
      "Request Services": RequestMapOrder,
      "Land Survey": LandSurveyOrder,
      "FTL Hydra": FTLOrder,
      "HMDA Masterplan": HMDAOrder,
      "TOPO Sheet": TopoOrder,
    };

    const Model = modelMap[type];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Admin Delete Order Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   4️⃣ GET MANAGERS
   ================================================= */
router.get("/managers", async (req, res) => {
  try {
    const managers = await User.find({ role: "manager" })
      .select("fullName mobile role");

    res.json({ success: true, managers });
  } catch (err) {
    console.error("❌ Fetch Managers Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;

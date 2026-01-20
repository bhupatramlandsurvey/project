const express = require("express");
const router = express.Router();
const ProcessedOrder = require("../models/ProcessedOrder");
const axios = require("axios");
const User = require("../models/User");

// All possible order models
const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const RequestMapOrder = require("../models/RequestMapOrder");
const LandSurveyOrder = require("../models/LandSurveyOrder");
const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const FAST2SMS_API_KEY =
  "FMmKdjVLiA7QXrtzxGfZYp5NOJwc9IvUEkeP4HlnRy0D1S6832sPBOUFAg1HlZo0mc8kQYI5znVESwJR";

// Map type → model
const modelMap = {
  "Download Maps": DownloadMapsAndFilesOrder,
  "Request Services": RequestMapOrder,
  "Land Survey": LandSurveyOrder,
  "FTL Hydra": FTLOrder,
  "HMDA Masterplan": HMDAOrder,
  "TOPO Sheet": TopoOrder,
};

/* ✅ 1️⃣ Get all processed orders (with manager + order details) */
router.get("/orders", async (req, res) => {
  try {
    const processedOrders = await ProcessedOrder.find()
      .populate("managerId", "fullName mobile")
      .sort({ createdAt: -1 });

    // 🧠 For each processed order, also fetch original order data
    const detailedOrders = await Promise.all(
      processedOrders.map(async (p) => {
        const Model = modelMap[p.type];
        let originalOrder = null;

        if (Model) {
          originalOrder = await Model.findById(p.orderId)
            .populate("user", "fullName mobile")
            .lean();
        }

        return {
          ...p.toObject(),
          manager: p.managerId || null,
          user: originalOrder?.user || null,
          orderDetails: originalOrder || {},
        };
      })
    );

    res.json({ success: true, orders: detailedOrders });
  } catch (err) {
    console.error("❌ Fetch Processed Orders Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ✅ 2️⃣ Admin can approve or reject processed order */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const processedOrder = await ProcessedOrder.findById(id)
      .populate("managerId", "fullName mobile");

    if (!processedOrder) {
      return res.status(404).json({
        success: false,
        message: "Processed order not found",
      });
    }

    processedOrder.status = status;
    processedOrder.feedback = feedback;
    processedOrder.updatedAt = new Date();
    await processedOrder.save();

    /* ------------------------------------
       ✅ APPROVED → USER SMS
    ------------------------------------ */
    if (status === "Approved") {
      const Model = modelMap[processedOrder.type];

      if (Model) {
        const originalOrder = await Model.findById(processedOrder.orderId)
          .populate("user", "fullName mobile");

        if (originalOrder?.user?.mobile) {
          // Mark original order completed
          await Model.findByIdAndUpdate(
            processedOrder.orderId,
            { status: "Completed", updatedAt: new Date() }
          );

          // 📲 SMS to USER
          await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
              authorization: FAST2SMS_API_KEY,
              route: "dlt",
              sender_id: "BLSOPC",
              message: "207153", // Order Completed
              variables_values: processedOrder.orderRef || "",
              flash: 0,
              numbers: originalOrder.user.mobile,
            },
          });
        }
      }
    }

    /* ------------------------------------
       ❌ REJECTED → MANAGER SMS
    ------------------------------------ */
    if (status === "Rejected" && processedOrder.managerId?.mobile) {
      await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: FAST2SMS_API_KEY,
          route: "dlt",
          sender_id: "BLSOPC",
          message: "207515", // Order Rejected
          variables_values: feedback || "",
          flash: 0,
          numbers: processedOrder.managerId.mobile,
        },
      });
    }

    res.json({
      success: true,
      message: "Processed order updated & SMS sent",
      order: processedOrder,
    });
  } catch (err) {
    console.error("❌ Update Processed Order Error:", err.response?.data || err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ✅ 3️⃣ Delete processed order (optional) */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProcessedOrder.findByIdAndDelete(id);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Processed order not found" });

    res.json({
      success: true,
      message: "Processed order deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete Processed Order Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

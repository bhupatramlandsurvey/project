const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");

const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const User = require("../models/User");
const { Price } = require("../models/Price");

const router = express.Router();

/* ------------------ FAST2SMS CONFIG ------------------ */
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY; // move to .env
const SMS_SENDER_ID = "BLSOPC";
const PAYMENT_SUCCESS_TEMPLATE_ID = "207154";

/* ------------------ RAZORPAY INIT ------------------ */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ------------------ HELPERS ------------------ */
const generateFriendlyId = (prefix) => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
};

const PRICE_NAME = {
  ftl: "FTL Map Hydra",
  hmda: "HMDA Masterplan",
  topo: "TOPO Sheet",
};

/* ------------------ CREATE ORDER (NO SMS HERE) ------------------ */
router.post("/create/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { userId, ...orderData } = req.body;

    if (!["ftl", "hmda", "topo"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    const priceItem = await Price.findOne({
      category: "ftlmaphydra",
      name: PRICE_NAME[type],
    });

    const amount = priceItem ? priceItem.price * 100 : 10000;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const razorOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `${type}_${Date.now()}`,
      notes: { userId },
    });

    let Model, prefix;
    if (type === "ftl") {
      Model = FTLOrder;
      prefix = "FTL";
    } else if (type === "hmda") {
      Model = HMDAOrder;
      prefix = "HMDA";
    } else {
      Model = TopoOrder;
      prefix = "TOPO";
    }

    const friendlyId = generateFriendlyId(prefix);

    const newOrder = await Model.create({
      user: userId,
      ...orderData,
      razorpayOrderId: razorOrder.id,
      amount,
      friendlyId,
      status: "Pending",
    });

    await User.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      order: newOrder,
      razorOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Order Create Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ------------------ VERIFY PAYMENT (SMS SENT HERE ✅) ------------------ */
router.post("/verify/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    let Model;
    if (type === "ftl") Model = FTLOrder;
    else if (type === "hmda") Model = HMDAOrder;
    else Model = TopoOrder;

    const order = await Model.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = "Processing";
    await order.save();
const io = req.app.get("io");
io.emit("new-order", {
  type: type.toUpperCase(),
  friendlyId: order.friendlyId,
});

    /* 🔔 SEND PAYMENT SUCCESS SMS */
    const user = await User.findById(order.user);
    if (user) {
      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: FAST2SMS_API_KEY,
            route: "dlt",
            sender_id: SMS_SENDER_ID,
            message: PAYMENT_SUCCESS_TEMPLATE_ID,
            variables_values: order.friendlyId,
            flash: 0,
            numbers: user.mobile,
          },
        });
      } catch (smsErr) {
        console.error("📩 SMS Failed:", smsErr.message);
      }
    }

    res.json({
      success: true,
      message: "Payment verified & SMS sent",
      friendlyId: order.friendlyId,
    });
  } catch (err) {
    console.error("❌ Verify Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

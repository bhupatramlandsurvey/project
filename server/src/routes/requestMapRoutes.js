const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
const axios = require("axios");

const RequestMapOrder = require("../models/RequestMapOrder");
const User = require("../models/User");
const { Price } = require("../models/Price");

dotenv.config();
const router = express.Router();

/* ---------------- FAST2SMS CONFIG ---------------- */
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const SMS_SENDER_ID = "BLSOPC";
const PAYMENT_SUCCESS_TEMPLATE_ID = "207154";

/* ---------------- RAZORPAY ---------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------- MULTER ---------------- */
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

/* =================================================
   CREATE REQUEST MAP ORDER (NO SMS HERE)
   ================================================= */
router.post("/create", upload.array("files", 10), async (req, res) => {
  try {
    const {
      user,
      userId,
      requestType,
      district,
      division,
      mandal,
      village,
      surveyNumber,
    } = req.body;

    const finalUser = user || userId;
    if (!finalUser) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    const uploadedFiles = (req.files || []).map((file) => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    }));

    /* 🔥 Dynamic price */
    const priceItem = await Price.findOne({
      category: "requestMaps",
      name: requestType,
    });

    const amount = priceItem ? priceItem.price * 100 : 5000;

    /* Razorpay order */
    const razorOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `REQMAP_${Date.now()}`,
    });

    const friendlyId = `REQMAP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await RequestMapOrder.create({
      user: finalUser,
      requestType,
      district,
      division,
      mandal,
      village,
      surveyNumber,
      uploadedFiles,
      amount,
      razorpayOrderId: razorOrder.id,
      orderId: friendlyId,
      friendlyId,
      status: "Pending",
    });

    await User.findByIdAndUpdate(finalUser, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      razorOrder,
      order: newOrder,
      friendlyId,
    });
  } catch (err) {
    console.error("❌ RequestMap Create Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =================================================
   VERIFY PAYMENT (SEND SMS HERE ✅)
   ================================================= */
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const order = await RequestMapOrder.findByIdAndUpdate(
      orderId,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "Processing",
        
      },
      { new: true }
    );
          const io = req.app.get("io");
io.emit("new-order", {
  type: "RequestMap",
  friendlyId: order.friendlyId,
}); 

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

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
      order,
      message: "Payment verified & SMS sent",
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

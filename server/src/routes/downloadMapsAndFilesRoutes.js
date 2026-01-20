const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");

const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const User = require("../models/User");
const { Price, STATIC_PRICE_ITEMS } = require("../models/Price");

const router = express.Router();

/* ---------------- FAST2SMS CONFIG ---------------- */
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const SMS_SENDER_ID = "BLSOPC";
const PAYMENT_SUCCESS_TEMPLATE_ID = "207154";     // Digitalized
const ADMIN_PAYMENT_TEMPLATE_ID = "207517";       // Admin
const CERTIFIED_PAYMENT_TEMPLATE_ID = "207637";   // Certified

/* ---------------- RAZORPAY INIT ---------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------- HELPERS ---------------- */
function normalizeName(str) {
  if (!str) return "";
  return str
    .split(/[\s/]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ")
    .replace(" Adangal", "/Adangal");
}

function normalizeExact(str) {
  if (!str) return "";
  return str
    .split("/")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join("/");
}

function detectCategory(normalizedType) {
  for (const category in STATIC_PRICE_ITEMS) {
    if (STATIC_PRICE_ITEMS[category].includes(normalizedType)) {
      return category;
    }
  }
  return null;
}

/* =================================================
   CREATE ORDER (NO SMS)
   ================================================= */
router.post("/create", async (req, res) => {
  try {
    let {
      userId,
      downloadType,
      source,
      district,
      division,
      mandal,
      village,
      mapType,
      surveyNumber,
      villageMapOption,
      yearFrom,
      yearTo,
    } = req.body;

    downloadType = normalizeExact(normalizeName(downloadType));

    const category =
      source === "certified"
        ? "certifiedCopies"
        : source === "digitalized"
        ? "digitalizedCopies"
        : detectCategory(downloadType);

    const priceItem = await Price.findOne({
      category,
      name: { $regex: `^${downloadType}$`, $options: "i" },
    });

    const amount = priceItem ? priceItem.price * 100 : 10000;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `DMF_${Date.now()}`,
    });

    const friendlyId = "DMF-" + Math.floor(1000 + Math.random() * 9000);

    const newOrder = await DownloadMapsAndFilesOrder.create({
      friendlyId,
      user: userId,
      downloadType,
      source,                 // ✅ SAVED
      categoryUsed: category,
      district,
      division,
      mandal,
      village,
      mapType,
      surveyNumber,
      villageMapOption,
      yearFrom,
      yearTo,
      razorpayOrderId: razorpayOrder.id,
      amount,
      status: "Pending",
    });

    await User.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      order: newOrder,
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Create Order Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =================================================
   VERIFY PAYMENT + SEND SMS
   ================================================= */
router.post("/verify", async (req, res) => {
  try {
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

    const order = await DownloadMapsAndFilesOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = "Processing";
    await order.save();

    /* 🔔 SOCKET EVENT */
    const io = req.app.get("io");
    io.emit("new-order", {
      type: "DownloadMaps",
      friendlyId: order.friendlyId,
    });

    /* =================================================
       USER SMS (CERTIFIED / DIGITALIZED)
       ================================================= */
    const user = await User.findById(order.user);

    if (user?.mobile) {
      const isCertified =
        order.categoryUsed === "certifiedCopies";

      const templateId = isCertified
        ? CERTIFIED_PAYMENT_TEMPLATE_ID
        : PAYMENT_SUCCESS_TEMPLATE_ID;

      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: FAST2SMS_API_KEY,
            route: "dlt",
            sender_id: SMS_SENDER_ID,
            message: templateId,
            variables_values: `${order.friendlyId}`, // ✅ NEVER EMPTY
            flash: 0,
            numbers: user.mobile,                  // ✅ NEVER EMPTY
          },
        });
      } catch (err) {
        console.error("📩 User SMS Failed:", err.response?.data || err.message);
      }
    } else {
      console.error("❌ User mobile missing:", order.user);
    }

    /* =================================================
       ADMIN SMS
       ================================================= */
    const admins = await User.find({
      role: "admin",
      mobile: { $exists: true, $ne: "" },
    }).select("mobile");

    if (admins.length) {
      const adminNumbers = admins.map(a => a.mobile).join(",");

      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: FAST2SMS_API_KEY,
            route: "dlt",
            sender_id: SMS_SENDER_ID,
            message: ADMIN_PAYMENT_TEMPLATE_ID,
            variables_values: `${order.friendlyId}`,
            flash: 0,
            numbers: adminNumbers,
          },
        });
      } catch (err) {
        console.error("📩 Admin SMS Failed:", err.response?.data || err.message);
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

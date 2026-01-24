const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const router = express.Router();

const FAST2SMS_API_KEY =
  "FMmKdjVLiA7QXrtzxGfZYp5NOJwc9IvUEkeP4HlnRy0D1S6832sPBOUFAg1HlZo0mc8kQYI5znVESwJR";

const SENDER_ID = "BLSOPC";
const DLT_TEMPLATE_ID = "207155"; // your DLT template id
const DEMO_MOBILE = "9988557711";

const DEMO_USER = {
  fullName: "Demo User",
  mobile: DEMO_MOBILE,
  role: "user",
};



// 🔹 Send OTP
router.post("/send-otp", async (req, res) => {
  const { fullName, mobile } = req.body;

  // 🔹 DEMO USER (NO OTP, NO SMS)
 if (mobile === DEMO_MOBILE) {
  let user = await User.findOne({ mobile });

  if (!user) {
    user = await User.create({ ...DEMO_USER });
  }

  return res.json({
    success: true,
    demo: true,
    message: "Demo login enabled. OTP not required.",
    user, // ✅ RETURN FULL USER DOCUMENT
  });
}


  // 🔹 NORMAL USERS (OTP FLOW)
  try {
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({
        fullName,
        mobile,
        otp,
        otpExpiresAt: expiry,
      });
    } else {
      user.otp = otp;
      user.otpExpiresAt = expiry;
      await user.save();
    }

    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: "dlt",
        sender_id: SENDER_ID,
        message: DLT_TEMPLATE_ID,
        variables_values: otp,
        numbers: mobile,
      },
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;

  // 🔹 DEMO USER (NO OTP CHECK)
  if (mobile === DEMO_MOBILE) {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Demo user not found",
      });
    }

    return res.json({
      success: true,
      message: "Demo login successful",
      user,
    });
  }

  // 🔹 NORMAL USERS
  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ success: true, message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;

// 🔹 OTP generator
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

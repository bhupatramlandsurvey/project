const express = require("express");
const LandSurveyOrder = require("../models/LandSurveyOrder");
const User = require("../models/User");

const router = express.Router();

// Generate unique ID
function generateFriendlyId() {
  return `LSURV-${Math.floor(1000 + Math.random() * 9000)}`;
}

router.post("/create", async (req, res) => {
  try {
    let {
      userId,
      user,
      surveyType,
      subType,
      district,
      division,
      mandal,
      village,
      surveyNo,
      wardNumber,
      blockNumber,
      tslrNumber,
    } = req.body;

    // -----------------------------
    // 🔥 FIX 1: AUTO DETECT USER ID
    // -----------------------------
    const finalUserId = userId || (user && user._id);

    if (!finalUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    // -----------------------------
    // 🔥 FIX 2: ALWAYS GENERATE FRIENDLY ID
    // -----------------------------
    const friendlyId = generateFriendlyId();

    // -----------------------------
    // 🔥 FIX 3: SAVE ORDER
    // -----------------------------
    const newOrder = await LandSurveyOrder.create({
      friendlyId,
      user: finalUserId,
      surveyType,
      subType,
      district,
      division,
      mandal,
      village,
      surveyNo,
      wardNumber,
      blockNumber,
      tslrNumber,
      status: "Pending",
    });
const io = req.app.get("io");
io.emit("new-order", {
  type: "LandSurvey",
  friendlyId: newOrder.friendlyId,
});

    // -----------------------------
    // 🔥 FIX 4: ADD ORDER TO USER
    // -----------------------------
    await User.findByIdAndUpdate(finalUserId, {
      $push: { orders: newOrder._id },
    });

    // -----------------------------
    // RESPONSE
    // -----------------------------
    res.json({
      success: true,
      order: newOrder,
      friendlyId,
    });

  } catch (err) {
    console.error("LandSurvey Create Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

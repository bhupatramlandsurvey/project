// routes/tourdairyRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TourDiary = require("../models/TourDiary");

// Helper: get user from header or body
function getUserId(req) {
  if (req.headers["x-user-id"]) return req.headers["x-user-id"];
  if (req.body.userId) return req.body.userId;
  return null;
}

// ----------------------------------------
// GET /api/tour-diary/:userId
// Load single diary document for user
// ----------------------------------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: false, message: "Invalid userId" });
    }

    const diary = await TourDiary.findOne({ userId });

    return res.json({
      success: true,
      data: diary || null
    });

  } catch (err) {
    console.error("GET diary error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ----------------------------------------
// POST /api/tour-diary/save
// Save or update entire diary for user (upsert)
// ----------------------------------------
router.post("/save", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: false, message: "Invalid userId" });
    }

    const { header = {}, rows = [] } = req.body;

    const updated = await TourDiary.findOneAndUpdate(
      { userId },
      { $set: { header, rows } },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: updated,
      message: "Diary saved successfully"
    });

  } catch (err) {
    console.error("SAVE diary error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;

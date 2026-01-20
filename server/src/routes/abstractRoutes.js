// routes/abstractRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Abstract = require("../models/Abstract");

function getUserId(req) {
  if (req.headers["x-user-id"]) return req.headers["x-user-id"];
  if (req.body.userId) return req.body.userId;
  return null;
}

// -------------------------
// GET /api/abstract/:userId
// Load user's single abstract record
// -------------------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: false, message: "Invalid userId" });
    }

    const doc = await Abstract.findOne({ userId });

    return res.json({
      success: true,
      data: doc || null
    });
  } catch (err) {
    console.error("Abstract GET error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// -------------------------
// POST /api/abstract/save
// Save or update (upsert) abstract record
// -------------------------
router.post("/save", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: false, message: "Invalid userId" });
    }

    const { header = {}, rows = [] } = req.body;

    const updated = await Abstract.findOneAndUpdate(
      { userId },
      { $set: { header, rows } },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: updated,
      message: "Abstract saved successfully"
    });
  } catch (err) {
    console.error("Abstract SAVE error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;

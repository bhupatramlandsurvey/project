const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-__v").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("❌ Fetch Users Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Fetch single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Fetch User Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Update user (role or name or mobile)
router.put("/:id", async (req, res) => {
  try {
    const { fullName, mobile, role } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, mobile, role },
      { new: true }
    ).select("-__v");

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User updated successfully", user: updated });
  } catch (err) {
    console.error("❌ Update User Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Delete user
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete User Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

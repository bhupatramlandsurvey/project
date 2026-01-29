const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },

    // 🔐 OTP fields 
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

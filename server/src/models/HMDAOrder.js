const mongoose = require("mongoose");

const HMDAOrderSchema = new mongoose.Schema({
  // 🔹 User who placed the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🔹 Manager assigned by admin
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // 🔹 Order Details
  hmdaSurvey: String,

  // 🔹 Payment & Status
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Failed"],
    default: "Pending",
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,

  // 🔹 Tracking Info
  friendlyId: { type: String, unique: true },
  remarks: { type: String },

  // 🔹 Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Auto-update "updatedAt" every time the document is modified
HMDAOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("HMDAOrder", HMDAOrderSchema);

const mongoose = require("mongoose");

const TopoOrderSchema = new mongoose.Schema({
  // 🔹 User who placed the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🔹 Manager assigned by admin
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // 🔹 Order Details
  topoMethod: String,
  sheetNumber: String,
  district: String,
  division: String,
  mandal: String,
  village: String,

  // 🔹 Payment & Tracking Info
  amount: Number,
  friendlyId: { type: String, unique: true },
  remarks: String,

  // 🔹 Status Tracking
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Cancelled", "Failed"],
    default: "Pending",
  },

  // 🔹 Razorpay Info
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // 🔹 Time Tracking
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Auto-update updatedAt before saving
TopoOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("TopoOrder", TopoOrderSchema);

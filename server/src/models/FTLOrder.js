const mongoose = require("mongoose");

const FTLOrderSchema = new mongoose.Schema({
  // 🔹 User who placed the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🔹 Manager assigned to handle the order
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // 🔹 Order Details
  ftlOption: String,
  district: String,
  division: String,
  mandal: String,
  village: String,
  lakeId: String,
  kuntaName: String,

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

  // 🔹 Friendly Tracking ID (e.g., "FTL-2391")
  friendlyId: { type: String, unique: true },

  // 🔹 Notes / Remarks
  remarks: { type: String },

  // 🔹 Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Auto-update "updatedAt" before saving
FTLOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("FTLOrder", FTLOrderSchema);

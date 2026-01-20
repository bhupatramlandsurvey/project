const mongoose = require("mongoose");

const requestMapOrderSchema = new mongoose.Schema({
  // 🔹 User who submitted the request
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🔹 Manager assigned to handle it
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // 🔹 Request Details
  requestType: { type: String, required: true },
  district: String,
  division: String,
  mandal: String,
  village: String,
  surveyNumber: String,

  // 🔹 Uploaded Files
  uploadedFiles: [
    {
      url: String,
      originalName: String,
      size: Number,
    },
  ],

  // 🔹 Payment and Tracking Info
  amount: { type: Number, default: 0 },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // 🔹 Order Identifiers
  orderId: String,
 friendlyId: { type: String, unique: true, required: true },

  // 🔹 Status and Notes
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Cancelled", "Failed"],
    default: "Pending",
  },
  remarks: String,

  // 🔹 Timestamps
  dateTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Automatically update "updatedAt" whenever the document changes
requestMapOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("RequestMapOrder", requestMapOrderSchema);

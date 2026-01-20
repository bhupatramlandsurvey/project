const mongoose = require("mongoose");

const landSurveyOrderSchema = new mongoose.Schema({
  // 🔹 User who created the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🔹 Manager assigned to this order
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // 🔹 Survey Details
  surveyType: { type: String, required: true },
  subType: String,
  district: String,
  division: String,
  mandal: String,
  village: String,
  surveyNo: String,
  wardNumber: String,
  blockNumber: String,
  tslrNumber: String,

  // 🔹 Order Info
  friendlyId: { type: String, unique: true, required: true }, // FIXED
  orderId: String, // optional

  // 🔹 Status and Tracking
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Cancelled", "Failed"],
    default: "Pending",
  },
  remarks: { type: String },

  // 🔹 Payment / Meta
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,

  // 🔹 Dates
  dateTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt timestamp
landSurveyOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("LandSurveyOrder", landSurveyOrderSchema);

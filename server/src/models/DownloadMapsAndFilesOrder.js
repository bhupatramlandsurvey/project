const mongoose = require("mongoose");

const downloadMapsAndFilesOrderSchema = new mongoose.Schema({
  /* 🔹 USER */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  /* 🔹 MANAGER (ADMIN ASSIGNMENT) */
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  /* 🔹 ORDER INFO */
  downloadType: { type: String, required: true },
  source: {
    type: String,
    enum: ["certified", "digitalized"],
  },
  categoryUsed: {
    type: String,
    enum: ["certifiedCopies", "digitalizedCopies"],
  },

  district: String,
  division: String,
  mandal: String,
  village: String,
  mapType: String,
  surveyNumber: String,
  villageMapOption: String,
  yearFrom: String,
  yearTo: String,

  /* 🔹 PAYMENT / STATUS */
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Failed"],
    default: "Pending",
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number, // in paise

  /* 🔹 TRACKING */
  friendlyId: { type: String, required: true },
  remarks: String,

  /* 🔹 TIMESTAMPS */
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/* ✅ Auto-update updatedAt on save */
downloadMapsAndFilesOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* ✅ Auto-update updatedAt on findByIdAndUpdate */
downloadMapsAndFilesOrderSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    this.set({ updatedAt: new Date() });
    next();
  }
);

module.exports = mongoose.model(
  "DownloadMapsAndFilesOrder",
  downloadMapsAndFilesOrderSchema
);

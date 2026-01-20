const mongoose = require("mongoose");

const processedOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "type",
    required: true,
  },

  // ✅ Remove enum restriction — different models have different names
  type: {
    type: String,
    required: true,
  },

  // ✅ Add orderRef (optional or required)
  orderRef: {
    type: String,
    required: false, // make optional, since not all models have this
  },

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  processedFiles: [
    {
      url: String,
      name: String,
      size: Number,
    },
  ],

  // ✅ Add all realistic statuses
  status: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Rejected", "Approved", "Cancelled"],
    default: "Processing",
  },

  feedback: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("ProcessedOrder", processedOrderSchema);

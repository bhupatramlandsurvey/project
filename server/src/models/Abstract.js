// models/Abstract.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AbstractRowSchema = new Schema(
  {
    nature: String,
    villages: Schema.Types.Mixed,
    files: Schema.Types.Mixed,
    synos: Schema.Types.Mixed,
    outturn: Schema.Types.Mixed,
    days: Schema.Types.Mixed
  },
  { _id: false }
);

const AbstractSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },

    header: {
      name: String,
      designation: String,
      pay: String,
      month: String
    },

    rows: { type: [AbstractRowSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Abstract", AbstractSchema);

// models/TourDiary.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const RowSchema = new Schema(
  {
    date: String,
    from: String,
    to: String,
    kind: String,
    distance: Schema.Types.Mixed,
    fileNo: String,
    govtLand: String,
    pattaLand: String,
    spotInspection: String,
    laHouse: String,
    sdWork: String,
    courtCases: String,
    copyTippons: String,
    description: String
  },
  { _id: false }
);

const TourDiarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    header: {
  officeTitle: String,
  name: String,
  designation: String,
  mandal: String,
  month: String
},

    rows: { type: [RowSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourDiary", TourDiarySchema);

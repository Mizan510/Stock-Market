const mongoose = require("mongoose");

const lbslReportSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    costAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    currentAssetsPP: {
      type: Number,
      required: true,
      default: 0,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LbslReport", lbslReportSchema);

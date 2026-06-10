const mongoose = require("mongoose");

const ZoneSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    low: { type: Number }, // 1Y low
    high: { type: Number }, // 1Y high
    buyPercent: { type: Number },
    sellPercent: { type: Number },
    todaysHigh: { type: Number },
    todaysLow: { type: Number },
    closingPrice: { type: Number },
    pivotPoint: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Zone", ZoneSchema);

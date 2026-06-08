const mongoose = require("mongoose");

const buySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    stockName: {
      type: String,
      default: "N/A",
    },
    date: {
      type: String,
    },
    buyQuantity: {
      type: Number,
      required: true,
    },
    perShareValue: {
      type: Number,
      required: true,
    },
    buyingTotalShareValue: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    totalValueWithCommission: {
      type: Number,
      required: true,
    },
    // Keep for backward compatibility
    quantity: {
      type: Number,
    },
    price: {
      type: Number,
    },
    total: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Buy", buySchema);

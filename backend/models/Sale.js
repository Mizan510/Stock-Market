const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    stockName: {
      type: String,
      required: true,
      default: "N/A",
    },

    saleQuantity: {
      type: Number,
      required: true,
    },

    perShareValue: {
      type: Number,
      required: true,
    },

    sallingTotalShareValue: {
      type: Number,
      required: true,
      default: 0,
    },

    commission: {
      type: Number,
      required: true,
      default: 0,
    },

    totalValueWithCommission: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Sale", saleSchema);

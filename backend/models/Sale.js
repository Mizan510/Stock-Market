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

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);
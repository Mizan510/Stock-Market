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
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Buy", buySchema);

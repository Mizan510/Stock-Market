const mongoose = require("mongoose");

const dividendSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    declarationDate: {
      type: Date,
      default: Date.now,
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    companyName: {
      type: String,
      default: "",
    },
    shares: {
      type: Number,
      default: 0,
    },
    dividendPercent: {
      type: Number,
      default: 0,
    },
    faceValue: {
      type: Number,
      default: 0,
    },
    perShareDividend: {
      type: Number,
      default: 0,
    },
    grossDividend: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    netDividend: {
      type: Number,
      default: 0,
    },
    netDividendSendInBank: {
      type: Number,
      default: 0,
    },
    bankPaymentDate: {
      type: Date,
      default: Date.now,
    },
    costPerShare: {
      type: Number,
      default: 0,
    },
    dividendPer100tk: {
      type: Number,
      default: 0,
    },
    purificationRate: {
      type: Number,
      default: 0,
    },
    purificationAmount: {
      type: Number,
      default: 0,
    },
    netDividendAfterPurification: {
      type: Number,
      default: 0,
    },
    nonShariahIncome: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Dividend", dividendSchema);

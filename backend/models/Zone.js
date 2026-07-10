const mongoose = require("mongoose");

const ZoneSchema = new mongoose.Schema(
  {
    company: { 
      type: String, 
      required: true, 
      uppercase: true, 
      trim: true 
    },
    low: { 
      type: Number, 
      default: null 
    },
    high: { 
      type: Number, 
      default: null 
    },
    buyPercent: { 
      type: Number, 
      default: null 
    },
    sellPercent: { 
      type: Number, 
      default: null 
    },
    todaysHigh: { 
      type: Number, 
      default: null 
    },
    todaysLow: { 
      type: Number, 
      default: null 
    },
    closingPrice: { 
      type: Number, 
      default: null 
    },
    pivotPoint: { 
      type: Number, 
      default: null 
    },
    todayVolume: { 
      type: Number, 
      default: null 
    },
    avgVolume1M: { 
      type: Number, 
      default: null 
    },
    ma20: { 
      type: Number, 
      default: null 
    },
    rsi14: { 
      type: Number, 
      default: null 
    },
    r1: { 
      type: Number, 
      default: null 
    },
    s1: { 
      type: Number, 
      default: null 
    },
    volRatio: { 
      type: Number, 
      default: null 
    },
    originalSignal: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },
    customSignal: {
      type: String,
      enum: [
        "Very Strong Buyer",
        "Strong Buyer",
        "Strong Buyer (NP)",
        "Weak Buyer",
        "Very Strong Seller",
        "Strong Seller",
        "Weak Seller",
        "Overbought (ST)",
        "Overbought (HR)",
        "Oversold (WB)",
        "Neutral",
      ],
      default: "Neutral",
    },
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Zone", ZoneSchema);

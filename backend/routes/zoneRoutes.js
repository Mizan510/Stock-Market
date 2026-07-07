const express = require("express");
const router = express.Router();
const Zone = require("../models/Zone");

const parseNumber = (value) => {
  // Handle null, undefined, empty string
  if (value === undefined || value === null || value === "") return null;
  
  // If it's already a number and is finite, return it
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  
  // Try to convert string to number (handle comma-separated values)
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }
  
  // Try to convert to number
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Calculate all indicators
const calculateIndicators = (data) => {
  const h = parseNumber(data.todaysHigh);
  const l = parseNumber(data.todaysLow);
  const c = parseNumber(data.closingPrice);
  const volume = parseNumber(data.todayVolume);
  const avgVolume = parseNumber(data.avgVolume1M);
  const ma20 = parseNumber(data.ma20);
  const rsi14 = parseNumber(data.rsi14);

  let pivot = null;
  let r1 = null;
  let s1 = null;
  let volRatio = null;
  let originalSignal = "Neutral";
  let customSignal = "Neutral";

  if (h !== null && l !== null && c !== null) {
    pivot = parseFloat(((h + l + c) / 3).toFixed(2));
    r1 = parseFloat((2 * pivot - l).toFixed(2));
    s1 = parseFloat((2 * pivot - h).toFixed(2));

    if (c > pivot) originalSignal = "Bullish";
    else if (c < pivot) originalSignal = "Bearish";
  }

  if (volume !== null && avgVolume !== null && avgVolume > 0) {
    volRatio = parseFloat((volume / avgVolume).toFixed(2));
  }

  // Enhanced Custom Signal Logic with MA20 and RSI14
  if (
    c !== null &&
    pivot !== null &&
    r1 !== null &&
    s1 !== null &&
    volRatio !== null &&
    ma20 !== null &&
    rsi14 !== null
  ) {
    const priceDiffPercent = Math.abs((c - pivot) / pivot);

    // Check if price is near pivot (within 0.5%)
    if (priceDiffPercent <= 0.005) {
      customSignal = "Neutral";
    }
    // Check for Overbought (RSI >= 70)
    else if (rsi14 >= 70) {
      customSignal = "Overbought (High Risk)";
    }
    // Check for Oversold (RSI <= 30)
    else if (rsi14 <= 30) {
      customSignal = "Oversold (Watch Bounce)";
    }
    // Very Strong Buyer: Close > R1, Vol Ratio >= 2, Close > MA20, RSI >= 55
    else if (c > r1 && volRatio >= 2 && c > ma20 && rsi14 >= 55) {
      customSignal = "Very Strong Buyer";
    }
    // Strong Buyer: Close > Pivot, Vol Ratio >= 1.5, Close > MA20, RSI >= 50
    else if (c > pivot && volRatio >= 1.5 && c > ma20 && rsi14 >= 50) {
      customSignal = "Strong Buyer";
    }
    // Weak Buyer: Close > Pivot, Vol Ratio >= 0.8, Close > MA20
    else if (c > pivot && volRatio >= 0.8 && c > ma20) {
      customSignal = "Weak Buyer";
    }
    // Very Strong Seller: Close < S1, Vol Ratio >= 2, Close < MA20, RSI <= 45
    else if (c < s1 && volRatio >= 2 && c < ma20 && rsi14 <= 45) {
      customSignal = "Very Strong Seller";
    }
    // Strong Seller: Close < Pivot, Vol Ratio >= 1.5, Close < MA20, RSI <= 50
    else if (c < pivot && volRatio >= 1.5 && c < ma20 && rsi14 <= 50) {
      customSignal = "Strong Seller";
    }
    // Weak Seller: Close < Pivot
    else if (c < pivot) {
      customSignal = "Weak Seller";
    }
    // Default
    else {
      customSignal = "Neutral";
    }
  } else {
    // Fallback: If we don't have all required values, use simpler logic
    if (c !== null && pivot !== null && r1 !== null && s1 !== null && volRatio !== null) {
      const priceDiffPercent = Math.abs((c - pivot) / pivot);

      if (priceDiffPercent <= 0.005) {
        customSignal = "Neutral";
      } else if (c > r1 && volRatio > 2) {
        customSignal = "Very Strong Buyer";
      } else if (c > pivot && volRatio > 1.5) {
        customSignal = "Strong Buyer";
      } else if (c > pivot) {
        customSignal = "Weak Buyer";
      } else if (c < s1 && volRatio > 2) {
        customSignal = "Very Strong Seller";
      } else if (c < pivot && volRatio > 1.5) {
        customSignal = "Strong Seller";
      } else if (c < pivot) {
        customSignal = "Weak Seller";
      } else {
        customSignal = "Neutral";
      }
    }
  }

  return { 
    pivotPoint: pivot, 
    r1, 
    s1, 
    volRatio, 
    originalSignal, 
    customSignal 
  };
};

const buildZoneData = (data) => {
  const zoneData = {};

  if (data.company !== undefined && data.company !== null) {
    zoneData.company = data.company.toUpperCase().trim();
  }

  // Define all fields that should be processed
  const fields = [
    "low",
    "high",
    "buyPercent",
    "sellPercent",
    "todaysHigh",
    "todaysLow",
    "closingPrice",
    "todayVolume",
    "avgVolume1M",
    "ma20",
    "rsi14",
  ];

  // Process each field
  fields.forEach((key) => {
    // Check if the field exists in the request body
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      // Handle the value
      if (value === undefined || value === null || value === "") {
        zoneData[key] = null;
      } else {
        const parsed = parseNumber(value);
        zoneData[key] = parsed;
      }
    }
  });

  // Calculate indicators with all available data
  const indicators = calculateIndicators({
    todaysHigh: zoneData.todaysHigh,
    todaysLow: zoneData.todaysLow,
    closingPrice: zoneData.closingPrice,
    todayVolume: zoneData.todayVolume,
    avgVolume1M: zoneData.avgVolume1M,
    ma20: zoneData.ma20,
    rsi14: zoneData.rsi14,
  });

  Object.assign(zoneData, indicators);

  return zoneData;
};

// GET all zones
router.get("/", async (req, res) => {
  try {
    const zones = await Zone.find().sort({ company: 1 });
    res.json(zones);
  } catch (err) {
    console.error("Error fetching zones:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
});

// POST create zone
router.post("/", async (req, res) => {
  try {
    const zoneData = buildZoneData(req.body);

    // Validate company name
    if (!zoneData.company) {
      return res.status(400).json({ 
        message: "Company name is required" 
      });
    }

    const existingZone = await Zone.findOne({ 
      company: zoneData.company 
    });
    
    if (existingZone) {
      return res.status(400).json({
        message: "Company already exists. Please use PUT to update.",
      });
    }

    const zone = new Zone(zoneData);
    await zone.save();
    res.status(201).json(zone);
  } catch (err) {
    console.error("Error creating zone:", err);
    res.status(400).json({ 
      message: err.message 
    });
  }
});

// PUT update zone
router.put("/:id", async (req, res) => {
  try {
    const zoneData = buildZoneData(req.body);

    // Validate company name
    if (!zoneData.company) {
      return res.status(400).json({ 
        message: "Company name is required" 
      });
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id, 
      zoneData, 
      {
        new: true,
        runValidators: true,
      }
    );

    if (!zone) {
      return res.status(404).json({ 
        message: "Zone not found" 
      });
    }

    res.json(zone);
  } catch (err) {
    console.error("Error updating zone:", err);
    res.status(400).json({ 
      message: err.message 
    });
  }
});

// DELETE zone
router.delete("/:id", async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ 
        message: "Zone not found" 
      });
    }
    res.json({ 
      message: "Zone deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting zone:", err);
    res.status(500).json({ 
      message: err.message 
    });
  }
});

module.exports = router;
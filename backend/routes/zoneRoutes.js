const express = require("express");
const router = express.Router();
const Zone = require("../models/Zone");

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
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

  if (
    c !== null &&
    pivot !== null &&
    r1 !== null &&
    s1 !== null &&
    volRatio !== null
  ) {
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

  return { pivotPoint: pivot, r1, s1, volRatio, originalSignal, customSignal };
};

const buildZoneData = (data) => {
  const zoneData = {};

  if (data.company !== undefined) {
    zoneData.company = data.company.toUpperCase().trim();
  }

  // Include ALL fields including volume
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

  fields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Allow explicit nulls so client can clear values
      const value = parseNumber(data[key]);
      zoneData[key] = value;
    }
  });

  // Calculate indicators
  const indicators = calculateIndicators({
    todaysHigh: zoneData.todaysHigh,
    todaysLow: zoneData.todaysLow,
    closingPrice: zoneData.closingPrice,
    todayVolume: zoneData.todayVolume,
    avgVolume1M: zoneData.avgVolume1M,
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST create zone
router.post("/", async (req, res) => {
  try {
    const zoneData = buildZoneData(req.body);

    const existingZone = await Zone.findOne({ company: zoneData.company });
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
    res.status(400).json({ message: err.message });
  }
});

// PUT update zone
router.put("/:id", async (req, res) => {
  try {
    const zoneData = buildZoneData(req.body);

    const zone = await Zone.findByIdAndUpdate(req.params.id, zoneData, {
      new: true,
      runValidators: true,
    });

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    res.json(zone);
  } catch (err) {
    console.error("Error updating zone:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE zone
router.delete("/:id", async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
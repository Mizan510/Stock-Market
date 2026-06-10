const express = require("express");
const router = express.Router();
const Zone = require("../models/Zone");

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const buildZoneData = (data) => {
  const zoneData = {};

  if (data.company !== undefined) zoneData.company = data.company;

  [
    "low",
    "high",
    "buyPercent",
    "sellPercent",
    "todaysHigh",
    "todaysLow",
    "closingPrice",
  ].forEach((key) => {
    const value = parseNumber(data[key]);
    if (value !== undefined) zoneData[key] = value;
  });

  if (
    zoneData.todaysLow !== undefined &&
    zoneData.todaysHigh !== undefined &&
    zoneData.closingPrice !== undefined
  ) {
    zoneData.pivotPoint = parseFloat(
      (
        (zoneData.todaysLow + zoneData.todaysHigh + zoneData.closingPrice) /
        3
      ).toFixed(2),
    );
  }

  return zoneData;
};

// GET all zones
router.get("/", async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST create zone
router.post("/", async (req, res) => {
  try {
    const zone = new Zone(buildZoneData(req.body));
    await zone.save();
    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update zone
router.put("/:id", async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      buildZoneData(req.body),
      {
        new: true,
      },
    );
    if (!zone) return res.status(404).json({ message: "Not found" });
    res.json(zone);
  } catch (err) {
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

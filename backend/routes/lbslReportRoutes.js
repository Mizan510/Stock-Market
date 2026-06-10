const express = require("express");
const LbslReport = require("../models/LbslReport");

const router = express.Router();

// CREATE OR UPDATE LBSL REPORT FOR USER
router.post("/add", async (req, res) => {
  try {
    const { userId, costAmount, currentAssetsPP } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reportData = {
      userId,
      costAmount: Number(costAmount) || 0,
      currentAssetsPP: Number(currentAssetsPP) || 0,
      savedAt: new Date(),
    };

    const lbslReport = await LbslReport.findOneAndUpdate(
      { userId },
      reportData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(201).json({
      message: "LBSL report saved successfully",
      data: lbslReport,
    });
  } catch (err) {
    console.error("Error creating/updating LBSL report:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE LBSL REPORT (must come before generic GET)
router.put("/update/:id", async (req, res) => {
  try {
    const { costAmount, currentAssetsPP } = req.body;

    const updatedReport = await LbslReport.findByIdAndUpdate(
      req.params.id,
      {
        ...(costAmount !== undefined && {
          costAmount: Number(costAmount) || 0,
        }),
        ...(currentAssetsPP !== undefined && {
          currentAssetsPP: Number(currentAssetsPP) || 0,
        }),
        savedAt: new Date(),
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "LBSL report updated successfully",
      data: updatedReport,
    });
  } catch (err) {
    console.error("Error updating LBSL report:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE LBSL REPORT (must come before generic GET)
router.delete("/delete/:id", async (req, res) => {
  try {
    await LbslReport.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "LBSL report deleted successfully" });
  } catch (err) {
    console.error("Error deleting LBSL report:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE LBSL REPORT FOR USER (generic, must come last)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId is not empty or "undefined"
    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({
        message: "Invalid userId",
        data: null,
      });
    }

    const lbslReport = await LbslReport.findOne({ userId });

    res.json({ data: lbslReport || null });
  } catch (err) {
    console.error("Error fetching LBSL report:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

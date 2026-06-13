const express = require("express");
const Buy = require("../models/Buy");

const router = express.Router();

// CREATE BUY
router.post("/add", async (req, res) => {
  try {
    const {
      userId,
      stockName,
      date, // Safely captured as a string (e.g., "2026-03-09")
      buyQuantity,
      perShareValue,
      buyingTotalShareValue,
      commission,
      totalValueWithCommission,
    } = req.body;

    const buy = new Buy({
      userId,
      stockName,
      date: date || new Date().toISOString().split("T")[0], // Fallback to current date string if empty
      buyQuantity: Number(buyQuantity),
      perShareValue: Number(perShareValue),
      buyingTotalShareValue: Number(buyingTotalShareValue),
      commission: Number(commission),
      totalValueWithCommission: Number(totalValueWithCommission),
      // Backward compatibility
      quantity: Number(buyQuantity),
      price: Number(perShareValue),
      total: Number(totalValueWithCommission),
    });

    await buy.save();

    res.status(201).json({
      message: "Buy saved successfully",
      buy,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE BUY
router.put("/update/:id", async (req, res) => {
  try {
    const {
      stockName,
      date, // ✅ FIX: Extract the modified date string from the body
      buyQuantity,
      perShareValue,
      buyingTotalShareValue,
      commission,
      totalValueWithCommission,
      quantity,
      price,
      total,
    } = req.body;

    const updatedBuy = await Buy.findByIdAndUpdate(
      req.params.id,
      {
        ...(stockName !== undefined && { stockName }),
        ...(date !== undefined && { date }), // ✅ FIX: Save the updated date string directly
        ...(buyQuantity !== undefined && { buyQuantity }),
        ...(perShareValue !== undefined && { perShareValue }),
        ...(buyingTotalShareValue !== undefined && { buyingTotalShareValue }),
        ...(commission !== undefined && { commission }),
        ...(totalValueWithCommission !== undefined && {
          totalValueWithCommission,
        }),
        ...(quantity !== undefined && { quantity }),
        ...(price !== undefined && { price }),
        ...(total !== undefined && { total }),
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Buy updated successfully",
      data: updatedBuy,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL BUYS
router.get("/names/:userId", async (req, res) => {
  try {
    const buys = await Buy.find({ userId: req.params.userId });
    const uniqueNames = [...new Set(buys.map((b) => b.stockName))];
    res.json(uniqueNames);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL BUYS FOR USER
router.get("/:userId", async (req, res) => {
  try {
    const buys = await Buy.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(buys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE BUY
router.delete("/delete/:id", async (req, res) => {
  try {
    await Buy.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Buy deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
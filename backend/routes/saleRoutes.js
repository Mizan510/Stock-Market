const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");

// CREATE SALE
router.post("/add", async (req, res) => {
  try {
    const { userId, stockName, quantity, price } = req.body;

    const total = quantity * price;

    const sale = new Sale({
      userId,
      stockName,
      quantity,
      price,
      total,
    });

    await sale.save();

    res.status(201).json({
      message: "Sale saved successfully",
      sale,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SALES
router.get("/:userId", async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.params.userId });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
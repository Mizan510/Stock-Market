const express = require("express");
const Buy = require("../models/Buy");

const router = express.Router();

// CREATE BUY
router.post("/add", async (req, res) => {
  try {
    const { userId, stockName, quantity, price } = req.body;

    const total = quantity * price;

    const buy = new Buy({
      userId,
      stockName,
      quantity,
      price,
      total,
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

// GET ALL BUYS
router.get("/names/:userId", async (req, res) => {
  try {
    const buys = await Buy.find({ userId: req.params.userId });

    const uniqueNames = [...new Set(buys.map(b => b.stockName))];

    res.json(uniqueNames);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

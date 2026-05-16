const express = require("express");
const router = express.Router();

const Sale = require("../models/Sale");


// ==============================
// CREATE SALE
// ==============================
router.post("/add", async (req, res) => {
  try {

    const {
      userId,
      stockName,
      quantity,
      price,
    } = req.body;

    const total =
      Number(quantity) * Number(price);

    const sale = new Sale({
      userId,
      stockName,
      quantity: Number(quantity),
      price: Number(price),
      total,
    });

    await sale.save();

    res.status(201).json({
      success: true,
      message: "Sale saved successfully",
      data: sale,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ==============================
// GET SALES BY USER
// ==============================
router.get("/:userId", async (req, res) => {
  try {

    const sales = await Sale.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json(sales);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


module.exports = router;
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
      saleQuantity,
      perShareValue,
      sallingTotalShareValue,
      commission,
      totalValueWithCommission,
      date,
    } = req.body;

    const sale = new Sale({
      userId,
      stockName,
      date: date || new Date().toISOString().split("T")[0],
      saleQuantity: Number(saleQuantity),
      perShareValue: Number(perShareValue),
      sallingTotalShareValue: Number(sallingTotalShareValue),
      commission: Number(commission),
      totalValueWithCommission: Number(totalValueWithCommission),
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

// ==============================
// UPDATE SALE
// ==============================
router.put("/update/:id", async (req, res) => {
  try {
    const {
      stockName,
      saleQuantity,
      perShareValue,
      sallingTotalShareValue,
      commission,
      totalValueWithCommission,
      date,
    } = req.body;

    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        ...(stockName !== undefined && { stockName }),
        ...(date !== undefined && { date }),
        ...(saleQuantity !== undefined && { saleQuantity }),
        ...(perShareValue !== undefined && { perShareValue }),
        ...(sallingTotalShareValue !== undefined && { sallingTotalShareValue }),
        ...(commission !== undefined && { commission }),
        ...(totalValueWithCommission !== undefined && {
          totalValueWithCommission,
        }),
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// DELETE SALE
// ==============================
router.delete("/delete/:id", async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sale deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

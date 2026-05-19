const express = require("express");
const router = express.Router();

const Dividend = require("../models/Dividend");

// ==============================
// ADD DIVIDEND
// ==============================
router.post("/add", async (req, res) => {
  try {
    const {
      userId,
      declarationDate,
      recordDate,
      companyName,
      shares,
      dividendPercent,
      faceValue,
      perShareDividend,
      grossDividend,
      taxPercent,
      taxAmount,
      netDividend,
      bankPaymentDate,
      costPerShare,
      dividendPer100tk,
    } = req.body;

    const data = new Dividend({
      userId,
      declarationDate: declarationDate ? new Date(declarationDate) : new Date(),
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      companyName,
      shares: Number(shares || 0),
      dividendPercent: Number(dividendPercent || 0),
      faceValue: Number(faceValue || 0),
      perShareDividend: Number(perShareDividend || 0),
      grossDividend: Number(grossDividend || 0),
      taxPercent: Number(taxPercent || 0),
      taxAmount: Number(taxAmount || 0),
      netDividend: Number(netDividend || 0),
      bankPaymentDate: bankPaymentDate ? new Date(bankPaymentDate) : null,
      costPerShare: Number(costPerShare || 0),
      dividendPer100tk: Number(dividendPer100tk || 0),
    });

    await data.save();

    res.json({
      success: true,
      message: "Dividend saved successfully",
      data,
    });
  } catch (err) {
    console.log("ADD DIVIDEND ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================
// GET DIVIDEND BY USER
// ==============================
router.get("/:userId", async (req, res) => {
  try {
    const data = await Dividend.find({
      userId: req.params.userId,
    }).sort({ recordDate: -1 });

    res.json(data);
  } catch (err) {
    console.log("GET DIVIDEND ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================
// DELETE DIVIDEND
// ==============================
router.delete("/delete/:id", async (req, res) => {
  try {
    await Dividend.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
});

// ==============================
// UPDATE DIVIDEND
// ==============================
router.put("/update/:id", async (req, res) => {
  try {
    const {
      declarationDate,
      recordDate,
      companyName,
      shares,
      dividendPercent,
      faceValue,
      perShareDividend,
      grossDividend,
      taxPercent,
      taxAmount,
      netDividend,
      bankPaymentDate,
      costPerShare,
      dividendPer100tk,
    } = req.body;

    const updated = await Dividend.findByIdAndUpdate(
      req.params.id,
      {
        declarationDate: declarationDate
          ? new Date(declarationDate)
          : undefined,
        recordDate: recordDate ? new Date(recordDate) : undefined,
        companyName,
        shares: Number(shares || 0),
        dividendPercent: Number(dividendPercent || 0),
        faceValue: Number(faceValue || 0),
        perShareDividend: Number(perShareDividend || 0),
        grossDividend: Number(grossDividend || 0),
        taxPercent: Number(taxPercent || 0),
        taxAmount: Number(taxAmount || 0),
        netDividend: Number(netDividend || 0),
        bankPaymentDate: bankPaymentDate
          ? new Date(bankPaymentDate)
          : undefined,
        costPerShare: Number(costPerShare || 0),
        dividendPer100tk: Number(dividendPer100tk || 0),
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;

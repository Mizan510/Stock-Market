const express = require("express");
const router = express.Router();

const Investment = require("../models/Investment");

// ==============================
// ADD TRANSACTION
// ==============================
router.post("/add", async (req, res) => {
  try {
    const { userId, type, amount, note, date } = req.body;

    const data = new Investment({
      userId,
      type,
      amount,
      note,
      date,
    });

    await data.save();

    res.json({
      success: true,
      message: "Transaction saved",
      data,
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
// GET ALL TRANSACTIONS BY USER
// ==============================
// Changed sorting to 1 (ascending) so ledger entries build 
// running balances chronologically from oldest to newest.
router.get("/:userId", async (req, res) => {
  try {
    const data = await Investment.find({
      userId: req.params.userId,
    }).sort({ date: 1 }); 

    res.json(data);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================
// DELETE INVESTMENT
// ==============================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Investment.findByIdAndDelete(id);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ==============================
// UPDATE INVESTMENT
// ==============================
// Added 'date' to destructured body properties so that table-row 
// inline date changes actually persist to your database.
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note, date } = req.body; 

    const updated = await Investment.findByIdAndUpdate(
      id,
      { amount, note, date }, 
      { new: true }
    );

    res.json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
});

module.exports = router;
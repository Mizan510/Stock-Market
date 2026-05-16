const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// CREATE EXPENSE
router.post("/add", async (req, res) => {
  try {
    const { userId, title, category, amount, note, date } = req.body;

    const expense = new Expense({
      userId,
      title,
      category,
      amount: Number(amount),
      note,
      date,
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: "Expense saved successfully",
      data: expense,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET EXPENSES BY USER
router.get("/:userId", async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.params.userId }).sort({
      date: -1,
    });
    res.json(expenses);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE EXPENSE
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, note, date } = req.body;

    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        title,
        category,
        amount: Number(amount),
        note,
        date,
      },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: updated,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE EXPENSE
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

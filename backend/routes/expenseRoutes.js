const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// CREATE EXPENSE
router.post("/add", async (req, res) => {
  try {
    const { userId, title, category, importance, amount, note, date } =
      req.body;

    const expense = new Expense({
      userId,
      title,
      category,
      importance,
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

// GET MONTHLY TOTAL EXPENSE FOR USER (CURRENT MONTH)
router.get("/monthly/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const total = (result && result[0] && result[0].total) || 0;

    res.json({ total });
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

// GET MONTHLY TOTAL EXPENSE FOR USER (CURRENT MONTH)
router.get("/monthly/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const total = (result && result[0] && result[0].total) || 0;

    res.json({ total });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE EXPENSE
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, importance, amount, note, date } = req.body;

    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        title,
        category,
        importance,
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

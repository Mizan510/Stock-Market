const express = require("express");
const router = express.Router();

const Investment = require("../models/Investment");

// ADD TRANSACTION (DEPOSIT / WITHDRAW)
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
      message: "Transaction saved",
      data,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL BY DATE
router.get("/:userId", async (req, res) => {
  try {
    const data = await Investment.find({ userId }).sort({ date: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
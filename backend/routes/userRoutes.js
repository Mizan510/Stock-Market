const router = require("express").Router();
const User = require("../models/User");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "name email isActive createdAt").sort({
      createdAt: -1,
    });
    res.json({ data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Unable to fetch users" });
  }
});

// Toggle active status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      message: "User status updated",
      data: { isActive: user.isActive },
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ message: "Unable to update user status" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Unable to delete user" });
  }
});

module.exports = router;

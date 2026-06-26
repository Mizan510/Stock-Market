const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ===== TEST ROUTE =====
router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ 
    success: true, 
    message: "User routes are working!",
    timestamp: new Date().toISOString()
  });
});

// ===== GET ALL USERS =====
router.get("/", async (req, res) => {
  console.log("GET /api/users hit");
  try {
    const users = await User.find({}, "name email isActive createdAt").sort({
      createdAt: -1,
    });
    console.log(`Found ${users.length} users`);
    res.json({ data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Unable to fetch users" });
  }
});

// ===== TOGGLE ACTIVE STATUS =====
router.put("/:id/status", async (req, res) => {
  console.log("PUT /:id/status hit with ID:", req.params.id);
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      console.log("User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    console.log("User status updated:", user.email, "isActive:", user.isActive);

    res.json({
      message: "User status updated",
      data: { isActive: user.isActive },
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ message: "Unable to update user status" });
  }
});

// ===== UPDATE USER =====
router.put("/:id", async (req, res) => {
  console.log("=== UPDATE USER REQUEST ===");
  console.log("ID:", req.params.id);
  console.log("Body:", req.body);
  
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Validate ID format
    if (!id || id.length !== 24) {
      console.log("Invalid ID format:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.log("User not found:", id);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("Found user:", user.email);

    // Check email uniqueness
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("Email already in use:", email);
        return res.status(400).json({
          success: false,
          message: "Email already in use by another account"
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    
    if (password) {
      if (password.length < 1) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 1 characters long"
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      console.log("Password updated");
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log("User updated successfully:", userResponse.email);

    res.json({
      success: true,
      message: "User updated successfully",
      data: userResponse
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Unable to update user: " + err.message
    });
  }
});

// ===== DELETE USER =====
router.delete("/:id", async (req, res) => {
  console.log("DELETE /:id hit with ID:", req.params.id);
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      console.log("User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User deleted:", user.email);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Unable to delete user" });
  }
});

module.exports = router;
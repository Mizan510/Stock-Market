const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==================== GET ALL USERS ====================
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

// ==================== TOGGLE ACTIVE STATUS ====================
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

// ==================== UPDATE USER (Name, Email, Password) ====================
router.put("/:id", async (req, res) => {
  console.log("=== UPDATE USER REQUEST ===");
  console.log("User ID:", req.params.id);
  console.log("Request body:", req.body);
  
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Validate ID format (MongoDB ObjectId is 24 characters)
    if (!id || id.length !== 24) {
      console.log("Invalid ID format:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      console.log("User not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("Found user:", user.email);

    // Check if email is already taken by another user
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
    
    // Update password if provided
    if (password) {
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long"
        });
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      console.log("Password updated for user:", user.email);
    }

    await user.save();

    // Return user without password
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

// ==================== DELETE USER ====================
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
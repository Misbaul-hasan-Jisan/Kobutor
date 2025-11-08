
// backend/controllers/userController.js
import User from "../models/user.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";

export const changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.user.id;

    // Validate new username
    if (!newUsername || newUsername.trim().length < 3) {
      return res.status(400).json({ 
        message: "Username must be at least 3 characters long" 
      });
    }

    if (newUsername.length > 20) {
      return res.status(400).json({ 
        message: "Username cannot exceed 20 characters" 
      });
    }

    // Check if username is available
    const existingUser = await User.findOne({ 
      username: newUsername.trim(),
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "Username is already taken" 
      });
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check cooldown period (e.g., once per week)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (user.lastUsernameChange && user.lastUsernameChange > oneWeekAgo) {
      const daysLeft = Math.ceil((user.lastUsernameChange - oneWeekAgo) / (24 * 60 * 60 * 1000));
      return res.status(400).json({ 
        message: `You can change your username again in ${daysLeft} days` 
      });
    }

    // Store old username in history
    user.previousUsernames.push({
      username: user.username,
      changedAt: new Date()
    });

    // Keep only last 5 username changes
    if (user.previousUsernames.length > 5) {
      user.previousUsernames = user.previousUsernames.slice(-5);
    }

    const oldUsername = user.username;
    
    // Update username
    user.username = newUsername.trim();
    user.lastUsernameChange = new Date();
    user.usernameChangeCount += 1;

    await user.save();

    // Update username in all chats (optional - for display purposes)
    await updateUsernameInChats(userId, newUsername);

    res.json({
      message: "Username updated successfully",
      newUsername: user.username,
      nextChangeAvailable: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

  } catch (err) {
    console.error("Username change error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to update username in chats (optional)
const updateUsernameInChats = async (userId, newUsername) => {
  try {
    // This is optional - it updates the populated data in chats
    // The actual messages still reference user ID
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username');
    
    // You can add real-time updates here if needed
  } catch (error) {
    console.error("Error updating username in chats:", error);
  }
};

export const getUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    const userId = req.user.id;

    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: "Username too short" });
    }

    const existingUser = await User.findOne({ 
      username: username.trim(),
      _id: { $ne: userId }
    });

    res.json({ 
      available: !existingUser,
      message: existingUser ? "Username taken" : "Username available"
    });
  } catch (err) {
    console.error("Username check error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('username email previousUsernames lastUsernameChange usernameChangeCount createdAt');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      email: user.email,
      joinDate: user.createdAt,
      usernameChangeCount: user.usernameChangeCount,
      lastUsernameChange: user.lastUsernameChange,
      canChangeUsername: canChangeUsername(user.lastUsernameChange),
      nextChangeDate: getNextChangeDate(user.lastUsernameChange)
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper functions
const canChangeUsername = (lastChange) => {
  if (!lastChange) return true;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return lastChange < oneWeekAgo;
};

const getNextChangeDate = (lastChange) => {
  if (!lastChange) return null;
  return new Date(lastChange.getTime() + 7 * 24 * 60 * 60 * 1000);
};
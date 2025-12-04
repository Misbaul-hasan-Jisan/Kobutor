// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.js";

const router = express.Router();

// Add Google Authentication for Kobutor
router.post("/signup/google", async (req, res) => {
  try {
    const { uid, email, username, displayName, photoURL, emailVerified } = req.body;

    console.log("🔍 GOOGLE AUTH REQUEST (Kobutor)");
    console.log("📝 Google user data:", { 
      email, 
      username: username || displayName,
      displayName 
    });

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // User exists - check auth method
      console.log("👤 Existing user found:", user.email);
      
      if (user.isVerified && user.status === "active") {
        // User already active - just login
        console.log("✅ User already active, generating token");
      } else {
        // Update user to active status
        user.isVerified = true;
        user.status = "active";
        user.googleId = uid;
        if (displayName && !user.displayName) user.displayName = displayName;
        await user.save();
      }
    } else {
      // Create new user
      console.log("👤 Creating new Google user");
      
      user = new User({
        username: username || displayName || email.split('@')[0],
        email: email.toLowerCase(),
        displayName: displayName || username || email.split('@')[0],
        photoURL: photoURL || '',
        isVerified: true,
        status: "active",
        googleId: uid,
        authProvider: 'google',
        password: null // No password for Google users
      });
      
      await user.save();
      console.log("✅ New Google user created:", user.email);
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        isVerified: user.isVerified,
        authProvider: 'google'
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    console.log("✅ Google authentication successful for:", user.email);

    res.json({
      success: true,
      message: "Google authentication successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isVerified: user.isVerified,
        authProvider: 'google'
      },
      token: authToken
    });

  } catch (error) {
    console.error("💥 Google auth error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during Google authentication" 
    });
  }
});

// Signup route - creates user with PENDING status and returns token for frontend
router.post("/signup/kobutor", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("🔍 SIGNUP PROCESS STARTED - PENDING VERIFICATION");
    console.log("📝 Input data:", { username, email, password: password ? "***" : "missing" });

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check if user already exists (including pending verification)
    console.log("🔎 Checking for existing user...");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        console.log("❌ Verified user already exists:", existingUser.email);
        return res.status(409).json({ 
          success: false,
          message: "Email already registered" 
        });
      } else {
        // If user exists but not verified, remove and allow new signup
        console.log("🔄 User exists but not verified - removing old record");
        await User.deleteOne({ email });
      }
    }
    console.log("✅ No existing verified user found");

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    console.log("🎫 Generating verification token...");
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log("🔑 Token generated:", emailVerificationToken);
    console.log("⏰ Token expires:", emailVerificationExpires);

    // Create user with PENDING status
    console.log("👤 Creating user with PENDING status...");
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires,
      status: "pending",
      isVerified: false,
      authProvider: 'email'
    });

    console.log("💾 Saving user to database...");
    await newUser.save();
    console.log("✅ User saved with PENDING status");

    // Verify the user was actually saved
    console.log("🔍 Verifying database save...");
    const savedUser = await User.findById(newUser._id);
    if (!savedUser) {
      console.log("❌ CRITICAL: User not found after save!");
      return res.status(500).json({ 
        success: false,
        message: "Failed to create user" 
      });
    }

    console.log("📋 SAVED USER DETAILS:");
    console.log("   📧 Email:", savedUser.email);
    console.log("   🔑 Token in DB:", savedUser.emailVerificationToken);
    console.log("   ⏰ Expires in DB:", savedUser.emailVerificationExpires);
    console.log("   📊 Status:", savedUser.status);
    console.log("   ✅ Verified:", savedUser.isVerified);

    console.log("🎉 SIGNUP PROCESS COMPLETED - RETURNING TOKEN FOR FRONTEND EMAIL");
    
    // Return token to frontend - FRONTEND will send the email
    res.status(201).json({
      success: true,
      requiresVerification: true,
      verificationToken: emailVerificationToken, // Send to frontend
      message: "User created successfully. Frontend will send verification email.",
      userId: newUser._id,
      email: email,
      username: username
      // Do NOT return user data or auth token - account is not active yet
    });

  } catch (err) {
    console.error("💥 SIGNUP ERROR:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
});

// Email verification route - COMPLETES the signup process
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    console.log("🔍 Email verification attempt");
    console.log("📧 Token:", token);

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: "Verification token is required" 
      });
    }

    // Find user with valid token and pending status
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
      status: "pending"
    });

    if (!user) {
      console.log("❌ Invalid, expired, or already used verification token");
      return res.status(400).json({ 
        success: false,
        message: "Invalid, expired, or already used verification token" 
      });
    }

    console.log("✅ User found - completing registration for:", user.email);

    // COMPLETE THE SIGNUP PROCESS - Activate the account
    user.isVerified = true;
    user.status = "active";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log("🎉 Registration COMPLETED for:", user.email);

    // NOW create JWT token since user is fully verified and active
    const authToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        isVerified: true,
        authProvider: user.authProvider || 'email'
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    console.log("🔑 JWT token created for verified user");

    res.json({
      success: true,
      message: "Email verified successfully! Your account has been created and you are now signed in.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isVerified: true,
        authProvider: user.authProvider || 'email'
      },
      token: authToken, // Only return token AFTER verification
    });

  } catch (error) {
    console.error("💥 Email verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during email verification" 
    });
  }
});

// Resend verification email - returns token for frontend to send email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔄 Resend verification request for:", email);

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    const user = await User.findOne({ 
      email,
      status: "pending"
    });

    if (!user) {
      console.log("❌ No pending user found with this email");
      return res.status(404).json({ 
        success: false,
        message: "No pending registration found for this email" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: "Email is already verified" 
      });
    }

    // Generate new verification token
    console.log("🎫 Generating new verification token...");
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    console.log("✅ New token generated and saved");

    console.log("🔄 Returning token to frontend for email sending");

    res.json({ 
      success: true,
      message: "Token generated - frontend will send verification email",
      verificationToken: emailVerificationToken, // Send to frontend
      email: user.email,
      username: user.username
    });
  } catch (error) {
    console.error("💥 Resend verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to resend verification email" 
    });
  }
});

// Login route - Only allows verified users
router.post("/login/kobutor", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if user is a Google user trying to use password login
    if (user.authProvider === 'google') {
      console.log("⚠️ Google user attempting password login:", email);
      return res.status(400).json({ 
        success: false,
        message: "This account uses Google Sign-In. Please use Google to login.",
        authProvider: 'google'
      });
    }

    // BLOCK login if not verified
    if (!user.isVerified || user.status !== "active") {
      console.log("🚫 Login blocked - user not verified:", email);
      return res.status(403).json({ 
        success: false,
        message: "Please verify your email before logging in. Check your email for the verification link.",
        requiresVerification: true,
        email: user.email
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    console.log("✅ Login successful for:", email);

    // Create token (only for verified, active users)
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        isVerified: true,
        authProvider: user.authProvider || 'email'
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isVerified: user.isVerified,
        authProvider: user.authProvider || 'email'
      },
      token,
    });
  } catch (err) {
    console.error("💥 Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

// Debug route to check all users (remove in production)
router.get("/debug/all-users", async (req, res) => {
  try {
    const allUsers = await User.find({}).select('username email status isVerified authProvider googleId emailVerificationToken emailVerificationExpires createdAt');
    
    console.log("🔍 DEBUG - ALL USERS IN DATABASE:");
    console.log("📊 Total users:", allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`--- User ${index + 1} ---`);
      console.log("📧 Email:", user.email);
      console.log("👤 Username:", user.username);
      console.log("📊 Status:", user.status);
      console.log("✅ Verified:", user.isVerified);
      console.log("🔑 Auth Provider:", user.authProvider || 'email');
      console.log("🔑 Google ID:", user.googleId || 'none');
      console.log("🔑 Token:", user.emailVerificationToken ? `${user.emailVerificationToken.substring(0, 20)}...` : "NULL");
      console.log("⏰ Expires:", user.emailVerificationExpires);
      console.log("📅 Created:", user.createdAt);
    });
    
    res.json({
      success: true,
      totalUsers: allUsers.length,
      users: allUsers
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ 
      success: false,
      error: "Debug failed" 
    });
  }
});

// Clean up expired pending users (optional - can be run as cron job)
router.get("/cleanup-expired", async (req, res) => {
  try {
    const result = await User.deleteMany({
      status: "pending",
      emailVerificationExpires: { $lt: new Date() }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} expired pending users`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired pending users`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ 
      success: false,
      error: "Cleanup failed" 
    });
  }
});

export default router;
// backend/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    status: { 
      type: String, 
      enum: ["pending", "active", "suspended"], 
      default: "pending" 
    },
    // Add username change tracking
    previousUsernames: [{ 
      username: String,
      changedAt: { type: Date, default: Date.now }
    }],
    lastUsernameChange: { type: Date },
    usernameChangeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Add index for username search
userSchema.index({ username: 1 });

export default mongoose.model("User", userSchema);
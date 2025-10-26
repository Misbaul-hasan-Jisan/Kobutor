// backend/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    // Add a field to track account status
    status: { 
      type: String, 
      enum: ["pending", "active", "suspended"], 
      default: "pending" 
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
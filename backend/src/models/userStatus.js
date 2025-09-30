// backend/models/userStatus.js
import mongoose from "mongoose";

const userStatusSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true 
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketId: { type: String },
    status: { 
      type: String, 
      enum: ["online", "away", "offline"], 
      default: "offline" 
    }
  },
  { 
    timestamps: true,
    indexes: [
      { userId: 1 },
      { isOnline: 1 },
      { lastSeen: 1 }
    ]
  }
);

// Update lastSeen when user goes offline
userStatusSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = false;
  this.status = "offline";
  return this.save();
};

// Set user as online
userStatusSchema.methods.setOnline = function(socketId) {
  this.isOnline = true;
  this.socketId = socketId;
  this.status = "online";
  this.lastSeen = new Date();
  return this.save();
};

// Set user as away
userStatusSchema.methods.setAway = function() {
  this.isOnline = false;
  this.status = "away";
  this.lastSeen = new Date();
  return this.save();
};

// Static method to get online users
userStatusSchema.statics.getOnlineUsers = function() {
  return this.find({ isOnline: true }).populate('userId', 'username email');
};

// Static method to get user status
userStatusSchema.statics.getUserStatus = function(userId) {
  return this.findOne({ userId }).populate('userId', 'username email');
};

export default mongoose.model("UserStatus", userStatusSchema);
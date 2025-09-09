// backend/models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 }, // Track total message count
    createdFromPigeon: { // Track if chat was created from a pigeon catch
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pigeon",
      default: null
    },
    deletedBy: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deletedAt: { type: Date, default: Date.now }
    }],
    // Additional metadata fields
    firstMessage: { type: String }, // Store the first message content
    isActive: { type: Boolean, default: true }, // Soft delete flag
    pigeonMessage: { type: String } // Store the original pigeon message that started the chat
  },
  { 
    timestamps: true,
    // Add indexes for better performance
    indexes: [
      { participants: 1 }, // For finding user chats
      { lastMessageAt: -1 }, // For sorting chats
      { "deletedBy.userId": 1 } // For filtering deleted chats
    ]
  }
);

// Virtual for getting active participants (not deleted the chat)
chatSchema.virtual('activeParticipants').get(function() {
  if (!this.deletedBy || this.deletedBy.length === 0) {
    return this.participants;
  }
  return this.participants.filter(participant => 
    !this.deletedBy.some(deleted => deleted.userId.equals(participant))
  );
});

// Method to check if user has deleted the chat
chatSchema.methods.hasUserDeleted = function(userId) {
  return this.deletedBy.some(deleted => deleted.userId.equals(userId));
};

// Method to mark chat as deleted for a user
chatSchema.methods.markAsDeleted = function(userId) {
  if (!this.hasUserDeleted(userId)) {
    this.deletedBy.push({ userId });
  }
  return this.save();
};

// Method to restore chat for a user
chatSchema.methods.restoreForUser = function(userId) {
  this.deletedBy = this.deletedBy.filter(deleted => !deleted.userId.equals(userId));
  return this.save();
};

// Static method to find active chats for a user
chatSchema.statics.findActiveChats = function(userId) {
  return this.find({
    participants: userId,
    "deletedBy.userId": { $ne: userId }
  }).populate('participants', 'username email');
};

export default mongoose.model("Chat", chatSchema);
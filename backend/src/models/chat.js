// backend/models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    createdFromPigeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pigeon",
      default: null
    },
    deletedBy: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deletedAt: { type: Date, default: Date.now }
    }],
    firstMessage: { type: String },
    isActive: { type: Boolean, default: true },
    pigeonMessage: { type: String },
    // New field for pinned messages
    pinnedMessages: [{
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
      pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      pinnedAt: { type: Date, default: Date.now }
    }]
  },
  { 
    timestamps: true,
    indexes: [
      { participants: 1 },
      { lastMessageAt: -1 },
      { "deletedBy.userId": 1 },
      { "pinnedMessages.messageId": 1 } // New index for pinned messages
    ]
  }
);

// Virtual for getting active participants
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

// Method to pin a message
chatSchema.methods.pinMessage = function(messageId, userId) {
  // Remove if already pinned
  this.pinnedMessages = this.pinnedMessages.filter(pm => !pm.messageId.equals(messageId));
  
  // Add to pinned messages
  this.pinnedMessages.push({
    messageId: messageId,
    pinnedBy: userId,
    pinnedAt: new Date()
  });
  
  // Keep only latest 5 pinned messages
  if (this.pinnedMessages.length > 5) {
    this.pinnedMessages = this.pinnedMessages
      .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt))
      .slice(0, 5);
  }
  
  return this.save();
};

// Method to unpin a message
chatSchema.methods.unpinMessage = function(messageId) {
  this.pinnedMessages = this.pinnedMessages.filter(pm => !pm.messageId.equals(messageId));
  return this.save();
};

// Static method to find active chats for a user
chatSchema.statics.findActiveChats = function(userId) {
  return this.find({
    participants: userId,
    "deletedBy.userId": { $ne: userId }
  }).populate('participants', 'username email');
};

// Static method to get pinned messages for a chat
chatSchema.statics.getPinnedMessages = async function(chatId) {
  const chat = await this.findById(chatId).populate({
    path: 'pinnedMessages.messageId',
    populate: { path: 'sender', select: 'username' }
  });
  
  return chat ? chat.pinnedMessages.map(pm => pm.messageId).filter(msg => msg !== null) : [];
};

export default mongoose.model("Chat", chatSchema);
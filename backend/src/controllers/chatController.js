// backend/controllers/chatController.js
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import { getIO } from "../sockets/socket.js";

// Get all chats for logged-in user
export const getUserChats = async (req, res) => {
  try {
    // Use the new static method to find active chats
    const chats = await Chat.findActiveChats(req.user.id)
      .sort({ lastMessageAt: -1 })
      .populate("participants", "username email");

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete chat for current user (soft delete)
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user to deletedBy array
    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: {
        deletedBy: { userId: req.user.id }
      }
    });

    // Notify other participant in real-time
    const otherParticipant = chat.participants.find(
      p => p.toString() !== req.user.id.toString()
    );
    
    if (otherParticipant) {
      getIO().to(otherParticipant.toString()).emit("chatDeleted", {
        chatId,
        deletedBy: req.user.id
      });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Check if user is participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({ chatId: chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username")
      .lean(); // Use lean() for better performance

    // Convert Map reactions to objects for all messages
    const messagesWithReactions = messages.map(message => ({
      ...message,
      reactions: message.reactions instanceof Map 
        ? Object.fromEntries(message.reactions) 
        : message.reactions || {}
    }));

    res.json(messagesWithReactions);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Send a message
// backend/controllers/chatController.js
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { chatId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    if (text.length > 1000) {
      return res.status(400).json({ message: "Message too long (max 1000 characters)" });
    }

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to send message in this chat" });
    }

    // Create message with initialized reactions map
    const message = await Message.create({
      chatId,
      sender: userId,
      text: text.trim(),
      readBy: [userId],
      isRead: false,
      reactions: new Map() // Initialize empty reactions map
    });

    // Update chat with last message info
     await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text.trim().substring(0, 100) + (text.length > 100 ? '...' : ''),
      lastMessageAt: new Date(),
      $inc: { messageCount: 1 } // Increment message count
    });
    // Populate the sender info before emitting
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email");

    // Convert Map to object for response - SAFELY
    let reactionsObject = {};
    if (populatedMessage.reactions instanceof Map) {
      reactionsObject = Object.fromEntries(populatedMessage.reactions);
    } else if (populatedMessage.reactions && typeof populatedMessage.reactions === 'object') {
      reactionsObject = populatedMessage.reactions;
    }

    const messageForResponse = {
      _id: populatedMessage._id,
      chatId: populatedMessage.chatId,
      sender: populatedMessage.sender,
      text: populatedMessage.text,
      readBy: populatedMessage.readBy,
      isRead: populatedMessage.isRead,
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
      reactions: reactionsObject
    };

    // Emit to all users in this chat room
    getIO().to(chatId).emit("receiveMessage", {
      _id: messageForResponse._id,
      chatId,
      sender: messageForResponse.sender._id,
      text: messageForResponse.text,
      createdAt: messageForResponse.createdAt,
      reactions: messageForResponse.reactions,
      isRead: messageForResponse.isRead
    });

    // Send notification to other participants
    const otherParticipants = chat.participants.filter(
      participant => participant.toString() !== userId.toString()
    );

    otherParticipants.forEach(participantId => {
      getIO().to(participantId.toString()).emit("newMessageNotification", {
        chatId,
        message: text.trim().substring(0, 50) + (text.length > 50 ? '...' : ''),
        sender: messageForResponse.sender.username,
        timestamp: new Date()
      });
    });

    res.status(201).json(messageForResponse);
  } catch (err) {
    console.error("Send message error:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid chat ID" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    // Update messages to mark as read
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        chatId: chatId,
        sender: { $ne: req.user.id } // Only mark others' messages as read
      },
      {
        $addToSet: { readBy: req.user.id },
        $set: { isRead: true }
      }
    );

    // Get the updated messages
    const updatedMessages = await Message.find({
      _id: { $in: messageIds }
    });

    // Emit socket event to notify other participants
    const chat = await Chat.findById(chatId);
    if (chat) {
      const otherParticipants = chat.participants.filter(
        participant => participant.toString() !== req.user.id
      );

      otherParticipants.forEach(participantId => {
        getIO().to(participantId.toString()).emit("messagesRead", {
          chatId,
          messageIds,
          readBy: req.user.id
        });
      });
    }

    res.json({ message: "Messages marked as read", updatedMessages });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unread message count for a user
export const getUnreadCount = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id });
    const chatIds = chats.map(chat => chat._id);

    const unreadCount = await Message.countDocuments({
      chatId: { $in: chatIds },
      sender: { $ne: req.user.id },
      readBy: { $ne: req.user.id }
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    // Validate emoji
    if (!emoji || emoji.length > 4) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    const message = await Message.findOne({
      _id: messageId,
      chatId: chatId
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Initialize reactions map if it doesn't exist
    if (!message.reactions) {
      message.reactions = new Map();
    }

    // Check if user already reacted with this emoji
    const reaction = message.reactions.get(emoji);
    if (reaction && reaction.users.includes(userId)) {
      return res.status(400).json({ message: "Already reacted with this emoji" });
    }

    // Add reaction
    if (reaction) {
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      message.reactions.set(emoji, {
        users: [userId],
        count: 1
      });
    }

    await message.save();

    // Populate user info for the reaction
    const populatedMessage = await Message.findById(messageId)
      .populate("reactions.$*.users", "username");

    // Emit socket event
    getIO().to(chatId).emit("messageReaction", {
      chatId,
      messageId,
      reactions: Object.fromEntries(populatedMessage.reactions)
    });

    res.json({ 
      message: "Reaction added", 
      reactions: Object.fromEntries(populatedMessage.reactions)
    });
  } catch (err) {
    console.error("Add reaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      chatId: chatId
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.reactions || !message.reactions.has(emoji)) {
      return res.status(400).json({ message: "No such reaction" });
    }

    const reaction = message.reactions.get(emoji);
    const userIndex = reaction.users.indexOf(userId);

    if (userIndex === -1) {
      return res.status(400).json({ message: "User didn't react with this emoji" });
    }

    // Remove user from reaction
    reaction.users.splice(userIndex, 1);
    reaction.count -= 1;

    // Remove the reaction entry if no users left
    if (reaction.users.length === 0) {
      message.reactions.delete(emoji);
    }

    await message.save();

    // Emit socket event
    getIO().to(chatId).emit("messageReaction", {
      chatId,
      messageId,
      reactions: Object.fromEntries(message.reactions)
    });

    res.json({ 
      message: "Reaction removed", 
      reactions: Object.fromEntries(message.reactions)
    });
  } catch (err) {
    console.error("Remove reaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle reaction (add or remove)
export const toggleReaction = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      chatId: chatId
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Initialize reactions if needed
    if (!message.reactions) {
      message.reactions = new Map();
    }

    const reaction = message.reactions.get(emoji);
    const hasReacted = reaction && reaction.users.includes(userId);

    if (hasReacted) {
      // Remove reaction
      const userIndex = reaction.users.indexOf(userId);
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;

      if (reaction.users.length === 0) {
        message.reactions.delete(emoji);
      }
    } else {
      // Add reaction
      if (reaction) {
        reaction.users.push(userId);
        reaction.count += 1;
      } else {
        message.reactions.set(emoji, {
          users: [userId],
          count: 1
        });
      }
    }

    await message.save();

    // Populate user info
    const populatedMessage = await Message.findById(messageId)
      .populate("reactions.$*.users", "username");

    // Emit socket event
    getIO().to(chatId).emit("messageReaction", {
      chatId,
      messageId,
      reactions: Object.fromEntries(populatedMessage.reactions)
    });

    res.json({ 
      message: hasReacted ? "Reaction removed" : "Reaction added",
      reactions: Object.fromEntries(populatedMessage.reactions)
    });
  } catch (err) {
    console.error("Toggle reaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get message reactions
export const getMessageReactions = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      chatId: chatId
    }).populate("reactions.$*.users", "username");

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ 
      reactions: Object.fromEntries(message.reactions || new Map())
    });
  } catch (err) {
    console.error("Get reactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Add these new functions to backend/controllers/chatController.js

// Pin a message
export const pinMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    // Check if user is participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if message exists
    const message = await Message.findOne({ _id: messageId, chatId });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Pin the message in chat
    await chat.pinMessage(messageId, userId);

    // Update the message itself
    message.isPinned = true;
    message.pinnedBy = userId;
    message.pinnedAt = new Date();
    await message.save();

    // Emit socket event
    getIO().to(chatId).emit("messagePinned", {
      chatId,
      messageId,
      pinnedBy: userId,
      pinnedAt: message.pinnedAt
    });

    res.json({ 
      message: "Message pinned successfully",
      pinnedMessage: message
    });
  } catch (err) {
    console.error("Pin message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Unpin a message
export const unpinMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    // Check if user is participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if message exists
    const message = await Message.findOne({ _id: messageId, chatId });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Unpin the message from chat
    await chat.unpinMessage(messageId);

    // Update the message itself
    message.isPinned = false;
    message.pinnedBy = undefined;
    message.pinnedAt = undefined;
    await message.save();

    // Emit socket event
    getIO().to(chatId).emit("messageUnpinned", {
      chatId,
      messageId
    });

    res.json({ 
      message: "Message unpinned successfully",
      unpinnedMessage: message
    });
  } catch (err) {
    console.error("Unpin message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle pin (pin/unpin)
export const togglePinMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    // Check if user is participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if message exists
    const message = await Message.findOne({ _id: messageId, chatId });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const wasPinned = message.isPinned;

    if (wasPinned) {
      // Unpin the message
      await chat.unpinMessage(messageId);
      message.isPinned = false;
      message.pinnedBy = undefined;
      message.pinnedAt = undefined;
    } else {
      // Pin the message
      await chat.pinMessage(messageId, userId);
      message.isPinned = true;
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
    }

    await message.save();

    // Emit socket event
    if (wasPinned) {
      getIO().to(chatId).emit("messageUnpinned", { chatId, messageId });
    } else {
      getIO().to(chatId).emit("messagePinned", {
        chatId,
        messageId,
        pinnedBy: userId,
        pinnedAt: message.pinnedAt
      });
    }

    res.json({ 
      message: wasPinned ? "Message unpinned" : "Message pinned",
      isPinned: !wasPinned,
      message: message
    });
  } catch (err) {
    console.error("Toggle pin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pinned messages for a chat
export const getPinnedMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Check if user is participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const pinnedMessages = await Chat.getPinnedMessages(chatId);

    res.json({ pinnedMessages });
  } catch (err) {
    console.error("Get pinned messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user status
export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const userStatus = await UserStatus.getUserStatus(userId);

    if (!userStatus) {
      return res.json({
        isOnline: false,
        status: "offline",
        lastSeen: new Date()
      });
    }

    res.json({
      isOnline: userStatus.isOnline,
      status: userStatus.status,
      lastSeen: userStatus.lastSeen,
      user: userStatus.userId
    });
  } catch (err) {
    console.error("Get user status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await UserStatus.getOnlineUsers();
    
    res.json({ onlineUsers });
  } catch (err) {
    console.error("Get online users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
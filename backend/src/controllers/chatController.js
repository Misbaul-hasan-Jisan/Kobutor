// backend/controllers/chatController.js
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import { getIO } from "../sockets/socket.js";

// Get all chats for logged-in user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      "deletedBy.userId": { $ne: req.user.id }
    })
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
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { chatId } = req.params;

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      text,
      readBy: [req.user.id],
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });

    // Emit to all users in this chat room
    getIO().to(chatId).emit("receiveMessage", {
      _id: message._id,
      chatId,
      sender: req.user.id,
      text,
      createdAt: message.createdAt,
    });

    res.status(201).json(message);
  } catch (err) {
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
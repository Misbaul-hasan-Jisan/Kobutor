// backend/controllers/pigeonController.js
import Pigeon from "../models/pigeon.js";
import Chat from "../models/chat.js";
import { getIO } from "../sockets/socket.js";

export const releasePigeon = async (req, res) => {
  try {
    const { content, color, location } = req.body;
    const userId = req.user.id;

    let zone = "local";
    if (location === "Global") zone = "international";
    if (location === "Random") zone = "random";

    const pigeon = await Pigeon.create({
      senderId: userId,
      zone,
      countryCode: location === "Bangladesh" ? "BD" : null,
      color,
      content,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ message: "Pigeon released", pigeon });
  } catch (err) {
    console.error("Release error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCatchablePigeons = async (req, res) => {
  try {
    const { location } = req.query;
    const userId = req.user.id;

    let query = {
      status: "catchable",
      expiresAt: { $gt: new Date() },
      senderId: { $ne: userId } // Don't show user's own pigeons
    };

    // NEW: Apply location filter based on zone system
    if (location) {
      if (location === 'Bangladesh') {
        query.zone = 'local';
        query.countryCode = 'BD';
      } else if (location === 'Global') {
        query.zone = 'international';
        query.countryCode = { $ne: 'BD' }; // Non-Bangladeshi pigeons
      } else if (location === 'Random') {
        // No additional filters for random - show pigeons from all zones
      }
    }

    // Get all pigeons that match the criteria
    const allPigeons = await Pigeon.find(query)
      .populate('senderId', 'username') // Populate sender info if needed
      .select("content color _id zone countryCode senderId")
      .limit(50);

    // Get users the current user has already chatted with
    const existingChats = await Chat.find({
      participants: userId
    }).select("participants");

    const alreadyChattedUserIds = new Set();
    existingChats.forEach(chat => {
      chat.participants.forEach(participant => {
        if (participant.toString() !== userId.toString()) {
          alreadyChattedUserIds.add(participant.toString());
        }
      });
    });

    // Filter out pigeons from users already chatted with
    const filteredPigeons = allPigeons.filter(pigeon => {
      // If pigeon has no senderId (shouldn't happen but safety check)
      if (!pigeon.senderId) return true;
      
      // Check if sender is someone we've already chatted with
      return !alreadyChattedUserIds.has(pigeon.senderId._id ? pigeon.senderId._id.toString() : pigeon.senderId.toString());
    });

    // Limit to 20 pigeons for performance
    const finalPigeons = filteredPigeons.slice(0, 20);

    const formatted = finalPigeons.map((p) => ({
      id: p._id.toString(),
      content: p.content,
      color: p.color,
      // Convert backend zone/countryCode to frontend location display
      location: p.zone === 'local' ? 'Bangladesh' : 
               p.zone === 'international' ? 'Global' : 
               p.zone === 'random' ? 'Random' : 'Unknown',
      senderId: p.senderId // Include senderId for debugging
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch pigeons error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const catchPigeon = async (req, res) => {
  try {
    const pigeon = await Pigeon.findById(req.params.id);
    if (!pigeon) return res.status(404).json({ message: "Pigeon not found" });

    const userId = req.user.id;

    // Check if user already has a chat with this sender
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, pigeon.senderId] }
    });

    let chat;
    
     if (existingChat) {
      // Use existing chat
      chat = existingChat;
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: pigeon.content.substring(0, 50) + (pigeon.content.length > 50 ? '...' : ''),
        lastMessageAt: new Date(),
      });
    } else {
      // Create new chat with pigeon metadata
      chat = await Chat.create({
        participants: [userId, pigeon.senderId],
        lastMessage: pigeon.content.substring(0, 50) + (pigeon.content.length > 50 ? '...' : ''),
        lastMessageAt: new Date(),
        createdFromPigeon: pigeon._id,
        pigeonMessage: pigeon.content,
        firstMessage: pigeon.content
      });
    }

    // Delete the pigeon (or mark as caught)
    await pigeon.deleteOne();

    // Notify sender in real time if it's a new chat
    if (!existingChat) {
      getIO()
        .to(pigeon.senderId.toString())
        .emit("newChat", { 
          chatId: chat._id,
        });
    }

    res.json({ 
      message: "Pigeon caught successfully", 
      chatId: chat._id,
      isNewChat: !existingChat
    });
  } catch (err) {
    console.error("Catch pigeon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

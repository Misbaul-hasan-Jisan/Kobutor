// backend/controllers/pigeonController.js
import Pigeon from "../models/pigeon.js";
import Chat from "../models/chat.js";
import { getIO } from "../sockets/socket.js";
import { countries, getCountryByCode } from "../utils/countries.js";
import { bangladeshDistricts, getDistrictByCode } from "../utils/bangladeshDistricts.js";

export const releasePigeon = async (req, res) => {
  try {
    const { content, color, location, district } = req.body; // Added district
    const userId = req.user.id;

    let zone = "local";
    let countryCode = "BD";
    let countryName = "Bangladesh";
    let districtCode = null;
    let districtName = null;

    if (location === "Random") {
      zone = "random";
      countryCode = null;
      countryName = "Random";
    } else if (location === "BD" && district) {
      // Bangladesh with specific district
      const bdDistrict = getDistrictByCode(district);
      if (!bdDistrict) {
        return res.status(400).json({ message: "Invalid district" });
      }
      zone = "local";
      countryCode = "BD";
      countryName = "Bangladesh";
      districtCode = bdDistrict.code;
      districtName = bdDistrict.name;
    } else {
      // International country
      const country = getCountryByCode(location);
      if (!country) {
        return res.status(400).json({ message: "Invalid country" });
      }
      zone = country.zone;
      countryCode = country.code;
      countryName = country.name;
    }

    const pigeon = await Pigeon.create({
      senderId: userId,
      zone,
      countryCode,
      countryName,
      districtCode,
      districtName,
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
    const { location, district } = req.query; // Added district
    const userId = req.user.id;

    let query = {
      status: "catchable",
      expiresAt: { $gt: new Date() },
      senderId: { $ne: userId }
    };

    // Apply location filter
    if (location && location !== 'Random') {
      if (location === 'BD' && district && district !== 'all') {
        // Filter by Bangladesh district
        query.countryCode = 'BD';
        query.districtCode = district;
      } else if (location === 'BD') {
        // All Bangladesh pigeons
        query.countryCode = 'BD';
      } else {
        // International country
        const country = getCountryByCode(location);
        if (country) {
          query.countryCode = country.code;
          query.zone = country.zone;
        }
      }
    }

    // Get all pigeons that match the criteria
    const allPigeons = await Pigeon.find(query)
      .populate('senderId', 'username')
      .select("content color _id zone countryCode countryName districtCode districtName senderId")
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
      if (!pigeon.senderId) return true;
      return !alreadyChattedUserIds.has(pigeon.senderId._id ? pigeon.senderId._id.toString() : pigeon.senderId.toString());
    });

    // Limit to 20 pigeons for performance
    const finalPigeons = filteredPigeons.slice(0, 20);

    const formatted = finalPigeons.map((p) => ({
      id: p._id.toString(),
      content: p.content,
      color: p.color,
      location: p.districtName || p.countryName, // Show district name for BD pigeons
      countryCode: p.countryCode,
      districtCode: p.districtCode,
      senderId: p.senderId
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch pigeons error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add new endpoint to get available countries and districts
export const getAvailableLocations = async (req, res) => {
  try {
    const locations = {
      local: countries.filter(c => c.zone === 'local'),
      international: countries.filter(c => c.zone === 'international'),
      bangladeshDistricts: bangladeshDistricts
    };
    res.json(locations);
  } catch (err) {
    console.error("Get locations error:", err);
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
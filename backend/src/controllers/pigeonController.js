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

    let zone = "local";
    if (location === "Global") zone = "international";
    if (location === "Random") zone = "random";

    const pigeons = await Pigeon.find({
      zone,
      status: "catchable",
      expiresAt: { $gt: new Date() },
    }).select("content color _id");

    const formatted = pigeons.map((p) => ({
      id: p._id.toString(),
      content: p.content,
      color: p.color,
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

    const chat = await Chat.create({
      participants: [req.user.id, pigeon.senderId],
      lastMessage: pigeon.content,
      lastMessageAt: new Date(),
    });

    await pigeon.deleteOne();

    // Optional: notify sender in real time
    getIO()
      .to(pigeon.senderId.toString())
      .emit("newChat", { chatId: chat._id });

    res.json({ message: "Pigeon caught", chatId: chat._id });
  } catch (err) {
    console.error("Catch pigeon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// backend/controllers/pigeonController.js
import Pigeon from "../models/pigeon.js";

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

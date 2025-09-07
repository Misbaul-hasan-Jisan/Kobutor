// backend/models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    deletedBy: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deletedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
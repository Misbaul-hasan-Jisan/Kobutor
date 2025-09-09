// backend/routes/chatRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { 
  getUserChats, 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead, 
  getUnreadCount,
  deleteChat,
  addReaction,
  removeReaction,
  toggleReaction,
  getMessageReactions
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", authMiddleware, getUserChats);
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.post("/:chatId/read", authMiddleware, markMessagesAsRead);
router.get("/unread/count", authMiddleware, getUnreadCount);
router.delete("/:chatId", authMiddleware, deleteChat);

// Reaction routes
router.post("/:chatId/messages/:messageId/react", authMiddleware, toggleReaction);
router.delete("/:chatId/messages/:messageId/react", authMiddleware, removeReaction);
router.get("/:chatId/messages/:messageId/reactions", authMiddleware, getMessageReactions);

export default router;
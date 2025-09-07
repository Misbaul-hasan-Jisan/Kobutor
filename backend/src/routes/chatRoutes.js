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
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", authMiddleware, getUserChats);
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.post("/:chatId/read", authMiddleware, markMessagesAsRead); // Add this route
router.get("/unread/count", authMiddleware, getUnreadCount); // Add this route
router.delete("/:chatId", authMiddleware, deleteChat);

export default router;

// backend/routes/chatRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getUserChats, getChatMessages, sendMessage, deleteChat } from "../controllers/chatController.js";


const router = express.Router();

router.get("/", authMiddleware, getUserChats);
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.delete("/:chatId", authMiddleware, deleteChat); // Add this line
export default router;

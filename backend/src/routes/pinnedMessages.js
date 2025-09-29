import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getPinnedMessages } from '../controllers/chatController.js';

const router = express.Router();

// Get pinned messages for a chat
router.get('/chats/:chatId/pinned-messages', authMiddleware, getPinnedMessages);

export default router;
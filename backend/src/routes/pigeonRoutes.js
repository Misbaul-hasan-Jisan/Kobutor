// backend/routes/pigeon.js
// backend/src/routes/pigeonRoutes.js
import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { releasePigeon, getCatchablePigeons } from '../controllers/pigeonController.js';
import { catchPigeon } from "../controllers/pigeonController.js";

const router = express.Router();

router.post('/', authMiddleware, releasePigeon);
router.get('/', authMiddleware, getCatchablePigeons); 
router.post("/:id/catch", authMiddleware, catchPigeon);

export default router;

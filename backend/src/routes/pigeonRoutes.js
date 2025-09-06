// backend/routes/pigeon.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { releasePigeon } from "../controllers/pigeonController.js";

const router = express.Router();

router.post("/", authMiddleware, releasePigeon);

export default router;

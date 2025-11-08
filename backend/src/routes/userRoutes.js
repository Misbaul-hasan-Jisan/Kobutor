// backend/routes/userRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { 
  changeUsername, 
  getUsernameAvailability, 
  getUserProfile 
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getUserProfile);
router.post("/username/change", authMiddleware, changeUsername);
router.get("/username/check", authMiddleware, getUsernameAvailability);

export default router;
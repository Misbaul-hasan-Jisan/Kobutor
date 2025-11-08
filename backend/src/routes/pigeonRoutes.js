// backend/routes/pigeonRoutes.js
import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { 
  releasePigeon, 
  getCatchablePigeons, 
  catchPigeon,
  getAvailableLocations 
} from '../controllers/pigeonController.js';

const router = express.Router();

router.post('/', authMiddleware, releasePigeon);
router.get('/', authMiddleware, getCatchablePigeons); 
router.post("/:id/catch", authMiddleware, catchPigeon);
router.get("/locations/available", authMiddleware, getAvailableLocations);

export default router;
import express from 'express';
// --- CHANGE: Import the new controller function ---
import { getMessages, sendMessage, markMessagesAsSeen } from '../controllers/messageController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// --- ADD: The new route for marking messages as seen ---
router.post("/seen/:id", protectRoute, markMessagesAsSeen);

export default router;
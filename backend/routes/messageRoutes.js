// backend/routes/messageRoutes.js
import express from 'express';
import { getMessages, sendMessage, markMessagesAsSeen, deleteMessage } from '../controllers/messageController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// The route for marking messages as seen
router.post("/seen/:id", protectRoute, markMessagesAsSeen);

// DELETE route: /api/messages/:id?scope=me or ?scope=everyone
router.delete("/:id", protectRoute, deleteMessage);

export default router;

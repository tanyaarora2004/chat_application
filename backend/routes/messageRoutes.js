// backend/routes/messageRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import protectRoute from '../middleware/authMiddleware.js';

import {
    getMessages,
    sendMessage,
    markMessagesAsSeen,
    deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

// ----------------------
// ⭐ AUDIO UPLOAD SETUP
// ----------------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/audio");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const audioUpload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ----------------------
// ROUTES
// ----------------------

// Get all messages
router.get("/:id", protectRoute, getMessages);

// Send text or audio message
router.post("/send/:id", protectRoute, sendMessage);

// Upload audio file (before sending)
router.post(
    "/upload-audio",
    protectRoute,
    audioUpload.single("audio"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        const audioUrl = `/uploads/audio/${req.file.filename}`;

        res.status(200).json({
            success: true,
            audioUrl,
        });
    }
);

// Mark messages as seen
router.post("/seen/:id", protectRoute, markMessagesAsSeen);

// Delete message (for me or everyone)
router.delete("/:id", protectRoute, deleteMessage);

export default router;

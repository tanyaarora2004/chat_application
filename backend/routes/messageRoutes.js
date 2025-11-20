// backend/routes/messageRoutes.js
import express from "express";
import multer from "multer";
import path from "path";

import protectRoute from "../middleware/authMiddleware.js";

import {
    getMessages,
    sendMessage,
    markMessagesAsSeen,
    deleteMessage,
} from "../controllers/messageController.js";

const router = express.Router();

// ============================
// 🎤 AUDIO UPLOAD SETUP (Your original code)
// ============================
const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/audio");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    },
});

const audioUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ============================
// 📦 FILE UPLOAD SETUP (Images, Videos, PDF, DOCX etc.)
// ============================
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // general files folder
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

// Allow: images, videos, pdf, docx
const fileFilter = (req, file, cb) => {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "video/mp4",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type"), false);
    }
};

const fileUpload = multer({
    storage: fileStorage,
    fileFilter,
});

// ============================
// ⭐ CAMERA IMAGE UPLOAD (NEW)
// ============================
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/images"); // camera images folder
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const imageFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
};

const imageUpload = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ============================
// ⭐ New Route: Upload Camera Image
// ============================
router.post(
    "/upload-image",
    protectRoute,
    imageUpload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const url = `/uploads/images/${req.file.filename}`;

        res.status(200).json({
            success: true,
            url,
        });
    }
);

// ============================
// ROUTES
// ============================

// Get all messages
router.get("/:id", protectRoute, getMessages);

// ⭐ Send message with:
// - text
// - audioUrl
// - fileUrl
router.post(
    "/send/:id",
    protectRoute,
    fileUpload.single("file"), // allow optional file upload
    sendMessage
);

// ⭐ Upload audio separately (your old route stays same)
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

// Delete message
router.delete("/:id", protectRoute, deleteMessage);

export default router;

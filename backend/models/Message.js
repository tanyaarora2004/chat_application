// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Normal text message
        message: {
            type: String,
        },

        // ⭐ AUDIO MESSAGE SUPPORT (Your original code)
        audioUrl: {
            type: String,
            default: null,
        },

        audioDuration: {
            type: Number,
            default: null,
        },

        // ⭐ FILE MESSAGE SUPPORT (PDF, DOCX, IMAGES, VIDEO, etc.)
        fileUrl: {
            type: String, 
            default: null,
        },

        fileType: {
            type: String, // MIME type (application/pdf, image/png, etc.)
            default: null,
        },

        // ⭐ MESSAGE TYPE (Now supports text, audio, file)
        messageType: {
            type: String,
            enum: ["text", "audio", "file"],
            default: "text",
        },

        // ⭐ STATUS
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },

        // ⭐ DELETION LOGIC (Your original code)
        deletedForEveryone: {
            type: Boolean,
            default: false,
        },

        deletedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

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

        // Normal text message (optional when audio is present)
        message: {
            type: String,
        },

        // ⭐ NEW: audio message URL (Cloudinary / local)
        audioUrl: {
            type: String,
            default: null,
        },

        // ⭐ NEW: audio duration (optional)
        audioDuration: {
            type: Number,
            default: null,
        },

        // message content type
        messageType: {
            type: String,
            enum: ["text", "audio"],
            default: "text",
        },

        // existing status field
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },

        // --- Deletion features ---
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
    { timestamps: true } // createdAt, updatedAt
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

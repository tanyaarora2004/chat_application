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

        // ⭐ TEXT MESSAGE
        message: {
            type: String,
            default: null,
        },

        // ⭐ AUDIO MESSAGE SUPPORT
        audioUrl: {
            type: String,
            default: null,
        },

        audioDuration: {
            type: Number,
            default: null,
        },

        // ⭐ CAMERA IMAGE (NEW)
        imageUrl: {
            type: String,
            default: null,
        },

        // ⭐ FILE MESSAGE SUPPORT (Documents, Videos, Images uploaded manually)
        fileUrl: {
            type: String,
            default: null,
        },

        fileType: {
            type: String,
            default: null, // mime type
        },

        // ⭐ MESSAGE TYPE (updated)
        messageType: {
            type: String,
            enum: ["text", "audio", "image", "file"],
            default: "text",
        },

        // ⭐ MESSAGE DELIVERY STATUS
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },

        // ⭐ DELETION LOGIC
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

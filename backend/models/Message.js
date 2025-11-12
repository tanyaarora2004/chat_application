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
        message: {
            type: String,
            required: true,
        },
        // existing status field
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },
        // --- NEW fields for deletion support ---
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
        // --- END NEW ---
    },
    { timestamps: true } // createdAt, updatedAt fields
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

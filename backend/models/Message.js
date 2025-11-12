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
        // --- ADD THIS ---
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },
        // --- END ADD ---
    },
    { timestamps: true } // createdAt, updatedAt fields
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
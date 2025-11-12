// socket/socket.js
import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/Message.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {}; // { userId: socketId }

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

export const handleMessageStatus = async (message) => {
    try {
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        const senderSocketId = getReceiverSocketId(message.senderId.toString());

        let updatedMessage = message;

        if (receiverSocketId) {
            if (message.status !== 'delivered' && message.status !== 'seen') {
                updatedMessage = await Message.findByIdAndUpdate(
                    message._id,
                    { status: "delivered" },
                    { new: true }
                );
            }
        }

        // Emit status update to sender
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", updatedMessage);
        }

        // Emit to receiver also for sync
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageStatusUpdate", updatedMessage);
        }

    } catch (error) {
        console.error("Error in handleMessageStatus:", error.message);
    }
};

io.on('connection', (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Typing indicator logic
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { senderId: userId });
        }
    });

    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", { senderId: userId });
        }
    });

    // ✅ Message Delivered - triggered when receiver receives the message
    socket.on("messageDelivered", async (messageId) => {
        console.log("📨 messageDelivered event received for messageId:", messageId);
        try {
            // Only update if message is still in 'sent' status
            const message = await Message.findOneAndUpdate(
                { _id: messageId, status: "sent" },
                { status: "delivered" },
                { new: true }
            );
            if (message) {
                console.log("📨 Message updated to delivered:", message._id);
                const senderSocketId = getReceiverSocketId(message.senderId.toString());
                if (senderSocketId) {
                    console.log("📨 Emitting messageStatusUpdate to sender:", message.senderId.toString());
                    io.to(senderSocketId).emit("messageStatusUpdate", message);
                } else {
                    console.log("❌ Sender socket not found for:", message.senderId.toString());
                }
            } else {
                console.log("⚠️ Message not found or already delivered:", messageId);
            }
        } catch (err) {
            console.error("Error updating delivered status:", err.message);
        }
    });

    // ✅ Message Seen - triggered when receiver opens chat
    socket.on("messageSeen", async ({ messageIds, senderId, receiverId }) => {
        try {
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { status: "seen" }
            );

            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesSeen", {
                    senderId,
                    receiverId,
                    messageIds,
                });
            }
        } catch (err) {
            console.error("Error updating seen status:", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };

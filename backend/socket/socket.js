import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const app = express();
const server = http.createServer(app);
const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
const io = new Server(server, {
    cors: {
        origin: CLIENT_URLS,
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {}; // { userId: socketId }

// Get socket ID of a specific user
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// MESSAGE STATUS HANDLING
export const handleMessageStatus = async (message) => {
    try {
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        const senderSocketId = getReceiverSocketId(message.senderId.toString());

        let updatedMessage = message;

        // Mark as delivered if receiver is online
        if (receiverSocketId) {
            if (message.status !== 'delivered' && message.status !== 'seen') {
                updatedMessage = await Message.findByIdAndUpdate(
                    message._id,
                    { status: "delivered" },
                    { new: true }
                );
            }
        }

        if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", updatedMessage);
        }

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageStatusUpdate", updatedMessage);
        }

    } catch (error) {
        console.error("Error in handleMessageStatus:", error.message);
    }
};

// SOCKET CONNECTION
io.on('connection', (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Join conversation
    socket.on('joinConversation', (conversationId) => {
        if (conversationId) {
            socket.join(conversationId);
        }
    });

    // Typing events
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

    // -------------------------------------------------------------
    //  AUDIO + VIDEO CALL FEATURE (WebRTC SIGNALING)
    // -------------------------------------------------------------

    // Caller → Offer
    // Now supports callType: "audio" | "video"
    socket.on("call-user", async ({ to, offer, callType = "audio" }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            try {
                const caller = await User.findById(userId).select('fullName username');
                
                const callerInfo = {
                    fullName: caller?.fullName || 'Unknown User',
                    username: caller?.username || 'unknown'
                };
                
                io.to(receiverSocketId).emit("incoming-call", {
                    from: userId,
                    callerInfo,
                    offer,
                    callType, //  tell receiver it’s audio or video
                });
            } catch (error) {
                io.to(receiverSocketId).emit("incoming-call", {
                    from: userId,
                    callerInfo: {
                        fullName: 'Unknown User',
                        username: 'unknown'
                    },
                    offer,
                    callType,
                });
            }
        }
    });

    // Callee → Answer
    socket.on("answer-call", ({ to, answer, callType = "audio" }) => {
        const callerSocketId = getReceiverSocketId(to);
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", { answer, callType });

            const timerStartTime = Date.now();
            io.to(callerSocketId).emit("call-timer-start", { startTime: timerStartTime });
            io.to(socket.id).emit("call-timer-start", { startTime: timerStartTime });
        }
    });

    // ICE Candidate
    socket.on("ice-candidate", ({ to, candidate }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("ice-candidate", candidate);
        }
    });

    // End Call
    socket.on("end-call", ({ to, callType }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended", { callType: callType || "audio" });
        }
    });

    // -------------------------------------------------------------
    //  NEW MESSAGE DELIVERED / SEEN HANDLING
    // -------------------------------------------------------------

    socket.on("messageDelivered", async (messageId) => {
        try {
            const message = await Message.findOneAndUpdate(
                { _id: messageId, status: "sent" },
                { status: "delivered" },
                { new: true }
            );

            if (message) {
                const senderSocketId = getReceiverSocketId(message.senderId.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageStatusUpdate", message);
                }
            }
        } catch (err) {
            console.error("Error updating delivered:", err.message);
        }
    });

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
            console.error("Error updating seen:", err.message);
        }
    });

    // -------------------------------------------------------------
    //  DISCONNECT EVENT
    // -------------------------------------------------------------
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        Object.keys(userSocketMap).forEach(otherUserId => {
            if (otherUserId !== userId) {
                const otherSocketId = userSocketMap[otherUserId];
                io.to(otherSocketId).emit("call-ended");
            }
        });

        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };

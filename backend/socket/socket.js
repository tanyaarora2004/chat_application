// backend/socket/socket.js
import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

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

        // Emit to sender
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", updatedMessage);
        }

        // Emit to receiver
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

    // 🔥 -------------------------------------------------------------
    // 🔥           AUDIO CALL FEATURE (WebRTC SIGNALING)
    // 🔥 -------------------------------------------------------------

    // Caller starts call → send offer
    socket.on("call-user", async ({ to, offer }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            try {
                // Get caller's information from database
                console.log('🔍 Fetching caller info for userId:', userId);
                const caller = await User.findById(userId).select('fullName username');
                console.log('📋 Found caller:', caller);
                
                const callerInfo = {
                    fullName: caller?.fullName || 'Unknown User',
                    username: caller?.username || 'unknown'
                };
                
                console.log('📤 Sending incoming-call with callerInfo:', callerInfo);
                io.to(receiverSocketId).emit("incoming-call", {
                    from: userId,
                    callerInfo: callerInfo,
                    offer
                });
            } catch (error) {
                console.error('Error fetching caller info:', error);
                // Fallback to basic info
                io.to(receiverSocketId).emit("incoming-call", {
                    from: userId,
                    callerInfo: {
                        fullName: 'Unknown User',
                        username: 'unknown'
                    },
                    offer
                });
            }
        }
    });

    // Callee accepts → send answer
    socket.on("answer-call", async ({ to, answer }) => {
        const callerSocketId = getReceiverSocketId(to);
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", { answer });
            
            // Start synchronized timer for both users
            const timerStartTime = Date.now();
            io.to(callerSocketId).emit("call-timer-start", { startTime: timerStartTime });
            io.to(socket.id).emit("call-timer-start", { startTime: timerStartTime });
        }
    });

    // ICE Candidate exchange
    socket.on("ice-candidate", ({ to, candidate }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("ice-candidate", candidate);
        }
    });

    // End Call
    socket.on("end-call", ({ to }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended");
        }
    });

    // 🔥 -------------------------------------------------------------
    // 🔥           END AUDIO CALL FEATURE
    // 🔥 -------------------------------------------------------------

    // Delivered event
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

    // Seen event
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

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        
        // Notify all other users that this user's call has ended if they were in a call
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

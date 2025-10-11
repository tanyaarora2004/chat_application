// 1️⃣ Load dotenv here as well to ensure variables are available
import dotenv from 'dotenv';
dotenv.config();

// 2️⃣ Continue with other imports
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // Now, this will correctly read the environment variable
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

io.on('connection', (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Send the list of online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // --- UPDATED: Typing Indicator Logic ---
    // Listen for the "typing" event from a client
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Send an event that includes the sender's ID
            io.to(receiverSocketId).emit("userTyping", { senderId: userId });
        }
    });

    // Listen for the "stopTyping" event from a client
    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Send an event that includes the sender's ID
            io.to(receiverSocketId).emit("userStoppedTyping", { senderId: userId });
        }
    });
    // --- END OF UPDATE ---

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };
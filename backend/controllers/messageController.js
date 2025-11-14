// backend/controllers/messageController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

// ⭐ SEND MESSAGE (TEXT OR AUDIO)
export const sendMessage = async (req, res) => {
    try {
        const { message, audioUrl, audioDuration, messageType } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Validate message type
        if (!message && !audioUrl) {
            return res.status(400).json({ error: "Message or audio is required" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // ⭐ Create new message (supports text/audio)
        const newMessage = new Message({
            senderId,
            receiverId,
            message: message || null,
            audioUrl: audioUrl || null,
            audioDuration: audioDuration || null,
            messageType: messageType || (audioUrl ? "audio" : "text"),
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]);

        // ⭐ Real-time send to receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);

            // Mark delivered immediately
            const deliveredMessage = await Message.findByIdAndUpdate(
                newMessage._id,
                { status: "delivered" },
                { new: true }
            );

            // Notify sender
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageStatusUpdate", deliveredMessage);
            }

            return res.status(201).json(deliveredMessage);
        }

        // Receiver is offline — return original message
        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ⭐ GET ALL MESSAGES
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages");

        if (!conversation) return res.status(200).json([]);

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ⭐ SEEN STATUS
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const userId = req.user._id;

        const result = await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, status: { $ne: "seen" } },
            { $set: { status: "seen" } }
        );

        if (result.modifiedCount > 0) {
            const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
            if (otherUserSocketId) {
                io.to(otherUserSocketId).emit("messagesSeen", {
                    senderId: otherUserId,
                    receiverId: userId,
                });
            }
        }

        res.status(200).json({ message: "Messages marked as seen" });
    } catch (error) {
        console.log("Error in markMessagesAsSeen controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ⭐ DELETE MESSAGE (ME / EVERYONE)
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const scope = req.query.scope || 'me';
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        // DELETE FOR ME
        if (scope === 'me') {
            const alreadyDeleted = message.deletedBy?.some(
                id => id.toString() === userId.toString()
            );

            if (!alreadyDeleted) {
                message.deletedBy.push(userId);
                await message.save();
            }

            const payload = await Message.findById(messageId).lean();

            const senderSocketId = getReceiverSocketId(message.senderId.toString());
            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

            if (senderSocketId) io.to(senderSocketId).emit('messageDeleted', payload);
            if (receiverSocketId) io.to(receiverSocketId).emit('messageDeleted', payload);

            return res.status(200).json({ success: true, message: payload });
        }

        // DELETE FOR EVERYONE (only sender)
        if (scope === 'everyone') {
            if (message.senderId.toString() !== userId.toString()) {
                return res.status(403).json({ error: "Only sender can delete this message" });
            }

            message.deletedForEveryone = true;
            await message.save();

            const payload = await Message.findById(messageId).lean();

            const senderSocketId = getReceiverSocketId(message.senderId.toString());
            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

            if (senderSocketId) io.to(senderSocketId).emit('messageDeleted', payload);
            if (receiverSocketId) io.to(receiverSocketId).emit('messageDeleted', payload);

            return res.status(200).json({ success: true, message: payload });
        }

        // Invalid scope
        res.status(400).json({ error: "Invalid scope" });

    } catch (error) {
        console.error("Error in deleteMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

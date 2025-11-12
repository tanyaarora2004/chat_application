// backend/controllers/messageController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getReceiverSocketId, io, handleMessageStatus } from '../socket/socket.js';

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]);

        // Send message in real time to receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);

            // If receiver is online, mark as delivered immediately
            const deliveredMessage = await Message.findByIdAndUpdate(
                newMessage._id,
                { status: "delivered" },
                { new: true }
            );

            console.log("📨 Message marked as delivered:", deliveredMessage._id, "Status:", deliveredMessage.status);

            // Notify sender about delivery status
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (senderSocketId) {
                console.log("📨 Emitting messageStatusUpdate to sender:", senderId);
                io.to(senderSocketId).emit("messageStatusUpdate", deliveredMessage);
            }

            // Return the updated message with delivery status
            res.status(201).json(deliveredMessage);
        } else {
            // Receiver is offline, return original message
            res.status(201).json(newMessage);
        }
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

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

export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const userId = req.user._id;

        console.log("📖 markMessagesAsSeen called:", { otherUserId, userId });

        const result = await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, status: { $ne: "seen" } },
            { $set: { status: "seen" } }
        );

        console.log("📖 Messages updated:", result.modifiedCount);

        if (result.modifiedCount > 0) {
            const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
            if (otherUserSocketId) {
                console.log("📖 Emitting messagesSeen to:", otherUserId);
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

/**
 * DELETE Message
 * Query param: scope=me (default) | everyone
 * - scope=me : add current user id to deletedBy array
 * - scope=everyone : only sender can call this (current implementation); sets deletedForEveryone = true
 */
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const scope = req.query.scope || 'me';
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        if (scope === 'me') {
            const alreadyDeleted = message.deletedBy?.some(id => id.toString() === userId.toString());
            if (!alreadyDeleted) {
                message.deletedBy = message.deletedBy || [];
                message.deletedBy.push(userId);
                await message.save();
            }

            // Emit messageDeleted to both participants if they are online
            const senderSocketId = getReceiverSocketId(message.senderId.toString());
            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

            const payload = await Message.findById(messageId).lean();

            if (senderSocketId) io.to(senderSocketId).emit('messageDeleted', payload);
            if (receiverSocketId) io.to(receiverSocketId).emit('messageDeleted', payload);

            return res.status(200).json({ success: true, message: payload });
        }

        if (scope === 'everyone') {
            // Only sender allowed to delete for everyone (change if you want different permission)
            if (message.senderId.toString() !== userId.toString()) {
                return res.status(403).json({ error: "Only sender can delete message for everyone" });
            }

            message.deletedForEveryone = true;

            // Optionally clear text to save space; keep original for audit if you want.
            // message.message = ""; // uncomment to clear content

            await message.save();

            const payload = await Message.findById(messageId).lean();

            const senderSocketId = getReceiverSocketId(message.senderId.toString());
            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

            if (senderSocketId) io.to(senderSocketId).emit('messageDeleted', payload);
            if (receiverSocketId) io.to(receiverSocketId).emit('messageDeleted', payload);

            return res.status(200).json({ success: true, message: payload });
        }

        return res.status(400).json({ error: "Invalid scope" });

    } catch (error) {
        console.error("Error in deleteMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

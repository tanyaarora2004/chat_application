// src/hooks/useListenMessages.js
import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";

const useListenMessages = () => {
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const {
        setMessages,
        updateMessage,
        setAllMessagesAsSeenBy,
        addTypingUser,
        removeTypingUser,
    } = useConversation();

    useEffect(() => {
        if (!socket) return;

        // ✅ New message received
        socket.on("newMessage", (newMessage) => {
            console.log("✅ Received 'newMessage':", newMessage);
            removeTypingUser(newMessage.senderId);
            setMessages((prev) => [...prev, newMessage]);

            // Confirm delivery immediately
            socket.emit("messageDelivered", newMessage._id);
        });

        // ✅ Typing Indicators
        socket.on("userTyping", ({ senderId }) => addTypingUser(senderId));
        socket.on("userStoppedTyping", ({ senderId }) => removeTypingUser(senderId));

        // ✅ Delivered / Seen Updates
        socket.on("messageStatusUpdate", (updatedMessage) => {
            console.log("✅ Received 'messageStatusUpdate':", updatedMessage);
            updateMessage(updatedMessage);
        });

        socket.on("messagesSeen", (payload) => {
            console.log("✅ Received 'messagesSeen':", payload);
            if (authUser._id === payload.senderId) {
                setAllMessagesAsSeenBy(payload.receiverId);
            }
        });

        // ✅ NEW: Message deleted updates
        socket.on("messageDeleted", (updatedMessage) => {
            console.log("✅ Received 'messageDeleted':", updatedMessage);
            // updatedMessage is the message document (with deletedForEveryone/deletedBy)
            updateMessage(updatedMessage);
        });

        return () => {
            socket.off("newMessage");
            socket.off("userTyping");
            socket.off("userStoppedTyping");
            socket.off("messageStatusUpdate");
            socket.off("messagesSeen");
            socket.off("messageDeleted");
        };
    }, [
        socket,
        setMessages,
        updateMessage,
        setAllMessagesAsSeenBy,
        addTypingUser,
        removeTypingUser,
        authUser,
    ]);
};

export default useListenMessages;

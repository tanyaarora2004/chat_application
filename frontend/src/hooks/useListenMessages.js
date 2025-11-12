// hooks/useListenMessages.js
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
            console.log("🔄 About to call updateMessage with:", updatedMessage._id, "status:", updatedMessage.status);
            updateMessage(updatedMessage);
        });

        socket.on("messagesSeen", (payload) => {
            console.log("✅ Received 'messagesSeen':", payload);
            console.log("🔍 Current authUser._id:", authUser._id);
            console.log("🔍 Payload details:", { senderId: payload.senderId, receiverId: payload.receiverId });
            
            // When User B marks messages as seen, User A (the sender) should see the blue ticks
            // The payload contains: { senderId: userA_id, receiverId: userB_id }
            // So if I am the sender (authUser._id === payload.senderId), update my UI
            if (authUser._id === payload.senderId) {
                console.log("✅ I am the sender, updating my messages to seen");
                setAllMessagesAsSeenBy(payload.receiverId);
            }
        });

        return () => {
            socket.off("newMessage");
            socket.off("userTyping");
            socket.off("userStoppedTyping");
            socket.off("messageStatusUpdate");
            socket.off("messagesSeen");
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

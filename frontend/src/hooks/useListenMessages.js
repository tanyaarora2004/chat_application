import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

const useListenMessages = () => {
    const { socket } = useSocketContext();
    // 1. Get the new actions to add/remove users from the typing Set
    const { messages, setMessages, addTypingUser, removeTypingUser } = useConversation();

    useEffect(() => {
        // Listen for new messages
        socket?.on("newMessage", (newMessage) => {
            // 2. When a message arrives, remove that specific sender from the typing Set
            removeTypingUser(newMessage.senderId);
            setMessages([...messages, newMessage]);
        });
        
        // 3. Listen for the new 'userTyping' event, which includes the sender's ID
        socket?.on("userTyping", ({ senderId }) => addTypingUser(senderId));

        // 4. Listen for the new 'userStoppedTyping' event
        socket?.on("userStoppedTyping", ({ senderId }) => removeTypingUser(senderId));

        // Cleanup function to remove all listeners when the component unmounts
        return () => {
            socket?.off("newMessage");
            socket?.off("userTyping");
            socket?.off("userStoppedTyping");
        };
    }, [socket, setMessages, messages, addTypingUser, removeTypingUser]); // 5. Update the dependency array
};

export default useListenMessages;
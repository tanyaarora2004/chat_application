import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

const useListenMessages = () => {
    const { socket } = useSocketContext();
    const { messages, setMessages } = useConversation();

    useEffect(() => {
        // Listen for "newMessage" events from the socket server
        socket?.on("newMessage", (newMessage) => {
            // Add the new incoming message to the state
            setMessages([...messages, newMessage]);
        });

        // Cleanup: stop listening to the event when the component unmounts
        return () => socket?.off("newMessage");
    }, [socket, setMessages, messages]);
};
export default useListenMessages;
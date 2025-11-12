import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import useConversation from "../zustand/useConversation";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const { setMessages, updateMessage, setAllMessagesAsSeenBy } = useConversation();

    useEffect(() => {
        if (authUser) {
            // ✅ Connect to your backend socket server
            const newSocket = io("http://localhost:5000", {
                query: { userId: authUser._id },
            });

            setSocket(newSocket);

            // ✅ Get online users
            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // ✅ Listen for new incoming messages
            newSocket.on("newMessage", (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });

            // ✅ Listen for delivery status updates
            newSocket.on("messageDelivered", (updatedMessage) => {
                updateMessage(updatedMessage);
            });

            // ✅ Listen for seen status updates
            newSocket.on("messageSeen", ({ otherUserId }) => {
                setAllMessagesAsSeenBy(otherUserId);
            });

            // ✅ Cleanup when component unmounts
            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

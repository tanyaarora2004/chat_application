import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    const sendMessage = async (message) => {
        setLoading(true);
        try {
            // API call to send the message
            const res = await apiClient.post(`/messages/send/${selectedConversation._id}`, { message });
            
            // Update the local messages state with the new message
            setMessages([...messages, res.data]);
        } catch (error) {
            toast.error(error.message || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
};
export default useSendMessage;
import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useGetMessages = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    useEffect(() => {
        const getMessages = async () => {
            if (!selectedConversation?._id) return;
            setLoading(true);
            try {
                // Fetch the message history for the selected conversation
                const res = await apiClient.get(`/messages/${selectedConversation._id}`);
                setMessages(res.data);
            } catch (error) {
                toast.error(error.message || "Failed to fetch messages");
            } finally {
                setLoading(false);
            }
        };

        getMessages();
    }, [selectedConversation?._id, setMessages]);

    return { messages, loading };
};
export default useGetMessages;
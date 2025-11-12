import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      if (!selectedConversation?._id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/messages/${selectedConversation._id}`);
        setMessages(res.data || []);
      } catch (error) {
        toast.error(error.message || "Failed to fetch messages");
      } finally {
        setLoading(false);
      }
    };

    // Clear old messages before fetching new ones
    setMessages([]);
    getMessages();
  }, [selectedConversation?._id, setMessages]);

  return { loading }; // Only return loading state
};

export default useGetMessages;

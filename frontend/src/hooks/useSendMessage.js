import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    const sendMessage = async (messageData, file = null) => {
        setLoading(true);
        try {
            let response;

            // ------------------------------
            // 1️⃣ TEXT MESSAGE (unchanged)
            // ------------------------------
            if (typeof messageData === 'string' && !file) {
                response = await apiClient.post(
                    `/messages/send/${selectedConversation._id}`,
                    { message: messageData }
                );
            }

            // ------------------------------
            // 2️⃣ VOICE MESSAGE (unchanged)
            // ------------------------------
            else if (messageData?.type === 'voice' && messageData.audioBlob) {
                const formData = new FormData();
                formData.append('audio', messageData.audioBlob, 'voice-message.webm');

                const uploadResponse = await apiClient.post('/messages/upload-audio', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                response = await apiClient.post(
                    `/messages/send/${selectedConversation._id}`,
                    {
                        audioUrl: uploadResponse.data.audioUrl,
                        messageType: 'audio',
                    }
                );
            }

            // ------------------------------
            // 3️⃣ FILE MESSAGE (ADDED NOW)
            // ------------------------------
            else if (file) {
                const formData = new FormData();
                formData.append("file", file);
                if (messageData) formData.append("message", messageData);

                response = await apiClient.post(
                    `/messages/send/${selectedConversation._id}`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
            }

            console.log("📤 Sent message response:", response?.data);

            // update UI
            if (response?.data) {
                setMessages([...messages, response.data]);
            }

        } catch (error) {
            console.error("Send message error:", error);
            toast.error(error.response?.data?.error || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
};

export default useSendMessage;

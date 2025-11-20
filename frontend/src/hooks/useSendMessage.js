import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    // ⭐ NEW: CAMERA IMAGE SENDER
    const uploadImageAndSend = async ({ fileBlob, conversationId }) => {
        try {
            console.log("📤 Starting image upload...", fileBlob);
            setLoading(true);

            const form = new FormData();
            form.append("image", fileBlob, "camera.jpg");

            console.log("📤 Uploading to /messages/upload-image...");
            
            // 1️⃣ Upload to server (multer)
            const uploadResponse = await apiClient.post(
                "/messages/upload-image",
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            console.log("📤 Upload response:", uploadResponse.data);
            const imageUrl = uploadResponse.data.url;

            console.log("📤 Creating message with imageUrl:", imageUrl);
            
            // 2️⃣ Now create a message in DB
            const msgResponse = await apiClient.post(
                `/messages/send/${conversationId}`,
                {
                    imageUrl,
                    messageType: "image",
                }
            );

            console.log("📤 Message response:", msgResponse.data);

            // 3️⃣ Update UI
            setMessages([...messages, msgResponse.data]);

        } catch (err) {
            console.error("📤 Image send failed:", err);
            console.error("📤 Error details:", err.response?.data || err.message);
            toast.error(`Failed to send image: ${err.response?.data?.error || err.message || "Unknown error"}`);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ⭐ EXISTING FUNCTION (text, audio, file)
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
            // 3️⃣ FILE MESSAGE (unchanged)
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

    // ⭐ NOTE: now returning uploadImageAndSend also
    return { sendMessage, uploadImageAndSend, loading };
};

export default useSendMessage;

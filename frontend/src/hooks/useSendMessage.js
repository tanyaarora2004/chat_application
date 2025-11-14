import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import apiClient from '../api/api.js';

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    const sendMessage = async (messageData) => {
        setLoading(true);
        try {
            let response;
            
            if (typeof messageData === 'string') {
                // Text message
                response = await apiClient.post(`/messages/send/${selectedConversation._id}`, { 
                    message: messageData 
                });
            } else if (messageData.type === 'voice' && messageData.audioBlob) {
                // Audio message - first upload the audio file
                const formData = new FormData();
                formData.append('audio', messageData.audioBlob, 'voice-message.webm');
                
                const uploadResponse = await apiClient.post('/messages/upload-audio', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                // Then send the message with audio URL
                response = await apiClient.post(`/messages/send/${selectedConversation._id}`, {
                    audioUrl: uploadResponse.data.audioUrl,
                    messageType: 'audio'
                });
            }
            
            console.log('📤 Sent message response:', response.data);
            console.log('📤 Message status from API:', response.data.status);
            
            // Update the local messages state with the new message
            setMessages([...messages, response.data]);
        } catch (error) {
            console.error('Send message error:', error);
            toast.error(error.response?.data?.error || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
};
export default useSendMessage;
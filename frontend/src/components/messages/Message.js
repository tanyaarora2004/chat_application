import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import '../../styles/Chat.css';
import ReadReceipt from './ReadReceipt.js';
import apiClient from '../../api/api.js';
import useConversation from '../../zustand/useConversation';
import { useSocketContext } from '../../context/SocketContext';

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();
    const fromMe = message.senderId?.toString() === authUser?._id?.toString();

    // Deletion state
    const iDeleted = message.deletedBy && message.deletedBy.some(id => id.toString() === authUser._id.toString());
    const isDeletedForEveryone = !!message.deletedForEveryone;

    // Time formatting
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    // ✅ Delete message (scope = 'me' or 'everyone')
    const handleDelete = async (scope) => {
        console.log("🗑️ Delete button clicked - scope:", scope, "messageId:", message._id);
        try {
            const response = await apiClient.delete(`/messages/${message._id}?scope=${scope}`);
            
            console.log("✅ Delete API success:", response.data);
            console.log("🔄 Waiting for socket event to update UI...");
        } catch (err) {
            console.error("❌ Delete API failed:", err.response?.data || err.message);
            console.error("📋 Full error:", err);
        }
    };

    // 🔹 Deleted for everyone
    if (isDeletedForEveryone) {
        return (
            <div className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}>
                <div className={`message-bubble deleted ${fromMe ? 'from-me' : 'from-them'}`}>
                    <i>This message was deleted</i>
                </div>
                <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                    <span>{formattedTime}</span>
                    {fromMe && <span className="message-receipt"><ReadReceipt status={message.status} /></span>}
                </div>
            </div>
        );
    }

    // 🔹 Deleted for me only
    if (iDeleted) {
        return (
            <div className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}>
                <div className={`message-bubble deleted-for-me ${fromMe ? 'from-me' : 'from-them'}`}>
                    <i>You deleted this message</i>
                </div>
                <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                    <span>{formattedTime}</span>
                </div>
            </div>
        );
    }

    // 🔹 Normal message
    return (
        <div className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}>
            <div className={`message-bubble ${fromMe ? 'from-me' : 'from-them'}`}>
                {message.message}
            </div>
            <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                <span>{formattedTime}</span>
                {fromMe && (
                    <span className="message-receipt">
                        <ReadReceipt status={message.status} />
                    </span>
                )}
                <div className="message-actions">
                    <button className="btn-link small" onClick={() => handleDelete('me')}>Delete for me</button>
                    {fromMe && (
                        <button className="btn-link small" onClick={() => handleDelete('everyone')}>Delete for everyone</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Message;

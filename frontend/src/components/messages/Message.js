import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import '../../styles/Chat.css';
import ReadReceipt from './ReadReceipt.js'; // --- ADD: Import the new component ---

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const fromMe = message.senderId?.toString() === authUser?._id?.toString();

    // Debug logging
    console.log('📧 Message component rendered:', message._id, 'status:', message.status, 'fromMe:', fromMe);

    // Format the timestamp
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}>
            <div className={`message-bubble ${fromMe ? 'from-me' : 'from-them'}`}>
                {message.message}
            </div>
            <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                <span>{formattedTime}</span>
                {/* --- ADD: Conditionally render the read receipt for your messages --- */}
                {fromMe && (
                    <span className="message-receipt">
                        <ReadReceipt status={message.status} />
                    </span>
                )}
                {/* --- END ADD --- */}
            </div>
        </div>
    );
};

export default Message;
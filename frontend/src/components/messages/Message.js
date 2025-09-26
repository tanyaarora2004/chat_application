import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import '../../styles/Chat.css';

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const fromMe = message.senderId?.toString() === authUser?._id?.toString();

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
                {formattedTime}
            </div>
        </div>
    );
};

export default Message;
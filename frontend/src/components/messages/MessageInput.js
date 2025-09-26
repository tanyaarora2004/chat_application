import React, { useState } from 'react';
import useSendMessage from '../../hooks/useSendMessage.js';
import '../../styles/Chat.css';

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const { loading, sendMessage } = useSendMessage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        await sendMessage(message);
        setMessage("");
    };

    return (
        <div className="message-input-container">
            <form onSubmit={handleSubmit} className="message-input-form">
                <input
                    type='text'
                    placeholder='Type a message...'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="message-input"
                />
                <button 
                    type='submit' 
                    disabled={loading || !message.trim()} 
                    className="send-button"
                    title="Send message"
                >
                    {loading ? '⋯' : '➤'}
                </button>
            </form>
        </div>
    );
};
export default MessageInput;
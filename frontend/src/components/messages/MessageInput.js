import React, { useState } from 'react';
import useSendMessage from '../../hooks/useSendMessage.js';
import '../../styles/Chat.css';
import { useSocketContext } from '../../context/SocketContext.js';
import useConversation from '../../zustand/useConversation.js';

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const { loading, sendMessage } = useSendMessage();
    
    // Get socket and conversation context
    const { socket } = useSocketContext();
    const { selectedConversation } = useConversation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // When a message is sent, emit "stopTyping" immediately
        if (socket) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }

        await sendMessage(message);
        setMessage("");
    };

    // Handle the onChange event to emit "typing"
    const handleTyping = (e) => {
        setMessage(e.target.value);
        if (socket) {
            socket.emit("typing", { receiverId: selectedConversation._id });
        }
    };

    // Handle the onBlur event to emit "stopTyping" when the input loses focus
    const handleStopTyping = () => {
        if (socket) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }
    };

    return (
        <div className="message-input-container">
            <form onSubmit={handleSubmit} className="message-input-form">
                <input
                    type='text'
                    placeholder='Type a message...'
                    value={message}
                    onChange={handleTyping} // Changed to the new handler
                    onBlur={handleStopTyping} // Added to detect when user clicks away
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
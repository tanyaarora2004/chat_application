import React from 'react';
import useConversation from '../../zustand/useConversation';
import { useSocketContext } from '../../context/SocketContext';
import '../../styles/Chat.css';

const Conversation = ({ user }) => {
    // 1. Get the typingUsers Set from the global Zustand store
    const { selectedConversation, setSelectedConversation, typingUsers } = useConversation();
    const isSelected = selectedConversation?._id === user._id;

    // Access the socket context to check for online users
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(user._id);

    // 2. Check if this specific user's ID is in the typingUsers Set
    const isTyping = typingUsers.has(user._id);

    const handleClick = () => {
        setSelectedConversation(user);
    };

    return (
        <div 
            className={`conversation-item ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
        >
            <div className="avatar">
                {user.fullName.charAt(0).toUpperCase()}
                {isOnline && <div className="online-indicator"></div>}
            </div>
            
            <div className="user-info">
                <div className="user-name">{user.fullName}</div>
                <div className="user-status">
                    {/* 3. Render the typing indicator with priority.
                        If the user is typing, show "Typing...".
                        Otherwise, fall back to the previous logic. */}
                    {isTyping ? (
                        <span className="sidebar-typing-indicator">Typing...</span>
                    ) : (
                        isSelected ? 'Selected' : 'Click to chat'
                    )}
                </div>
            </div>
        </div>
    );
};

export default Conversation;
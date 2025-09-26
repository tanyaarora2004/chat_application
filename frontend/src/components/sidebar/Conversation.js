import React from 'react';
import useConversation from '../../zustand/useConversation';
import { useSocketContext } from '../../context/SocketContext';
import '../../styles/Chat.css';

const Conversation = ({ user }) => {
    // Access the global state to set the selected conversation
    const { selectedConversation, setSelectedConversation } = useConversation();
    const isSelected = selectedConversation?._id === user._id;

    // Access the socket context to check for online users
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(user._id);

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
                    {isSelected ? 'Selected' : 'Click to chat'}
                </div>
            </div>
        </div>
    );
};

export default Conversation;

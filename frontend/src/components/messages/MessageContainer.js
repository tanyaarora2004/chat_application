import React, { useEffect } from 'react';
import Messages from './Messages.js';
import MessageInput from './MessageInput.js';
import useConversation from '../../zustand/useConversation.js';
import { useAuthContext } from '../../context/AuthContext';
import '../../styles/Chat.css';

// Avatar component with CSS classes
const Avatar = ({ fullName }) => {
    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';
    return (
        <div className="avatar">
            {initial}
        </div>
    );
};


const MessageContainer = () => {
    // 1. Get the typingUsers Set from the store instead of the old 'isTyping'
    const { selectedConversation, setSelectedConversation, typingUsers } = useConversation();

    // 2. Derive the typing status for the currently selected user
    const isCurrentlyTyping = selectedConversation ? typingUsers.has(selectedConversation._id) : false;

    useEffect(() => {
        // Cleanup function to deselect conversation on unmount
        return () => setSelectedConversation(null);
    }, [setSelectedConversation]);

    return (
        <div className="message-container">
            {!selectedConversation ? (
                <NoChatSelected />
            ) : (
                <>
                    <div className="chat-header">
                        <Avatar fullName={selectedConversation.fullName} />
                        <div className="chat-user-details">
                            <span className="chat-user-name">
                                {selectedConversation.fullName}
                            </span>
                            {/* 3. Use the new derived boolean to show the indicator */}
                            {isCurrentlyTyping && <span className="typing-indicator">Typing...</span>}
                        </div>
                    </div>
                    <Messages />
                    <MessageInput />
                </>
            )}
        </div>
    );
};

const NoChatSelected = () => {
    const { authUser } = useAuthContext();
    return (
        <div className="no-chat-selected">
            <div className="no-chat-content fade-in">
                <p className="welcome-title">Welcome {authUser?.fullName}</p>
                <p className="welcome-subtitle">Select a chat to start messaging</p>
            </div>
        </div>
    );
};

export default MessageContainer;
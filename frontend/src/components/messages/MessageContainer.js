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
    const { selectedConversation, setSelectedConversation } = useConversation();

    useEffect(() => {
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
                        <span className="chat-user-name">
                            {selectedConversation.fullName}
                        </span>
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
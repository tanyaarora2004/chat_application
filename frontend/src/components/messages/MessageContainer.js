// src/components/messages/MessageContainer.js
import React, { useEffect, useState } from 'react';
import Messages from './Messages.js';
import MessageInput from './MessageInput.js';
import CameraModal from './CameraModal.js';
import useConversation from '../../zustand/useConversation.js';
import { useAuthContext } from '../../context/AuthContext';
import { useSocketContext } from "../../context/SocketContext";
import useSendMessage from '../../hooks/useSendMessage.js';
import '../../styles/Chat.css';

// Avatar component
const Avatar = ({ fullName }) => {
    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';
    return <div className="avatar">{initial}</div>;
};

const MessageContainer = () => {
    const { selectedConversation, setSelectedConversation, typingUsers } = useConversation();
    const { startCall } = useSocketContext();
    const { uploadImageAndSend } = useSendMessage();
    
    // Camera state
    const [openCamera, setOpenCamera] = useState(false);

    // Check if selected user is typing
    const isCurrentlyTyping = selectedConversation
        ? typingUsers.has(selectedConversation._id)
        : false;

    // Camera capture handler
    const handleCapture = async (blob) => {
        try {
            await uploadImageAndSend({
                fileBlob: blob,
                conversationId: selectedConversation._id,
            });
            setOpenCamera(false);
        } catch (err) {
            alert("Failed to send image");
        }
    };

    useEffect(() => {
        return () => setSelectedConversation(null);
    }, [setSelectedConversation]);

    return (
        <div className="message-container">
            {!selectedConversation ? (
                <NoChatSelected />
            ) : (
                <>
                    {/* Camera Modal */}
                    {openCamera && (
                        <CameraModal
                            onClose={() => setOpenCamera(false)}
                            onCapture={handleCapture}
                        />
                    )}

                    {/* ======================================================== */}
                    {/*                     CHAT HEADER                          */}
                    {/* ======================================================== */}
                    <div className="chat-header">
                        <Avatar fullName={selectedConversation.fullName} />

                        <div className="chat-user-details">
                            <span className="chat-user-name">
                                {selectedConversation.fullName}
                            </span>

                            {isCurrentlyTyping && (
                                <span className="typing-indicator">Typing...</span>
                            )}
                        </div>

                        {/* ======================================================== */}
                        {/*                  WHATSAPP-STYLE CALL ACTIONS            */}
                        {/* ======================================================== */}
                        <div className="chat-header-actions">
                            <button
                                className="header-action-btn call-btn"
                                onClick={() => {
                                    console.log('📞 Call button clicked for:', selectedConversation.fullName, 'ID:', selectedConversation._id);
                                    startCall(selectedConversation._id);
                                }}
                                title="Audio Call"
                            >
                                📞
                            </button>
                            
                            <button
                                className="header-action-btn menu-btn"
                                title="More options"
                            >
                                ⋮
                            </button>
                        </div>
                    </div>

                    {/* Chat messages */}
                    <Messages />

                    {/* Input box */}
                    <MessageInput onOpenCamera={() => setOpenCamera(true)} />
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

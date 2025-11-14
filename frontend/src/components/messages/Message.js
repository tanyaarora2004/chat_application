import React, { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import '../../styles/Chat.css';
import ReadReceipt from './ReadReceipt.js';
import apiClient from '../../api/api.js';
import useConversation from '../../zustand/useConversation';
import { useSocketContext } from '../../context/SocketContext';

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();

    const fromMe =
        message.senderId?.toString() === authUser?._id?.toString();

    const [showPopup, setShowPopup] = useState(false);

    // Deletion state
    const iDeleted =
        message.deletedBy &&
        message.deletedBy.some(id => id.toString() === authUser._id.toString());

    const isDeletedForEveryone = !!message.deletedForEveryone;

    // Time formatting
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Delete message
    const handleDelete = async (scope) => {
        try {
            const response = await apiClient.delete(
                `/messages/${message._id}?scope=${scope}`
            );
            console.log("Delete success:", response.data);
            setShowPopup(false);
        } catch (err) {
            console.error("Delete failed:", err.response?.data || err.message);
        }
    };

    // If deleted for everyone
    if (isDeletedForEveryone) {
        return (
            <div className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}>
                <div className={`message-bubble deleted ${fromMe ? 'from-me' : 'from-them'}`}>
                    <i>This message was deleted</i>
                </div>

                <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                    <span>{formattedTime}</span>
                    {fromMe && (
                        <span className="message-receipt">
                            <ReadReceipt status={message.status} />
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // If deleted only for me
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

    // -----------------------------
    // 🔊 Voice Message Support
    // -----------------------------
    const isVoiceMsg = message.messageType === "audio" && message.audioUrl;

    const renderMessageContent = () => {
        if (isVoiceMsg) {
            return (
                <audio 
                    controls 
                    className="voice-audio-player"
                    onContextMenu={(e) => e.preventDefault()}
                    controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                    disablePictureInPicture
                    preload="metadata"
                >
                    <source src={`http://localhost:5000${message.audioUrl}`} type="audio/webm" />
                    <source src={`http://localhost:5000${message.audioUrl}`} type="audio/wav" />
                    Your browser does not support the audio element.
                </audio>
            );
        }

        return message.message;
    };

    // Normal message rendering
    return (
        <>
            <div
                className={`message-wrapper ${fromMe ? 'from-me' : 'from-them'}`}
                onClick={() => setShowPopup(true)}
            >
                <div className={`message-bubble ${fromMe ? 'from-me' : 'from-them'}`}>
                    {renderMessageContent()}
                </div>

                <div className={`message-time ${fromMe ? 'from-me' : 'from-them'}`}>
                    <span>{formattedTime}</span>
                    {fromMe && (
                        <span className="message-receipt">
                            <ReadReceipt status={message.status} />
                        </span>
                    )}
                </div>
            </div>

            {/* Popup */}
            {showPopup && (
                <div
                    className="delete-popup-overlay"
                    onClick={() => setShowPopup(false)}
                >
                    <div
                        className="delete-popup"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="delete-popup-title">Delete this message?</p>

                        <button
                            className="delete-popup-btn"
                            onClick={() => handleDelete('me')}
                        >
                            Delete for me
                        </button>

                        {fromMe && (
                            <button
                                className="delete-popup-btn"
                                onClick={() => handleDelete('everyone')}
                            >
                                Delete for everyone
                            </button>
                        )}

                        <div className="delete-popup-footer">
                            <button
                                className="delete-cancel-btn"
                                onClick={() => setShowPopup(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Message;

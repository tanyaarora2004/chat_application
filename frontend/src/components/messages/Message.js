import React, { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import "../../styles/Chat.css";
import ReadReceipt from "./ReadReceipt.js";
import apiClient from "../../api/api.js";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();

    const fromMe = message.senderId?.toString() === authUser?._id?.toString();
    const [showPopup, setShowPopup] = useState(false);

    // Deletion
    const iDeleted =
        message.deletedBy &&
        message.deletedBy.some((id) => id.toString() === authUser._id.toString());

    const isDeletedForEveryone = !!message.deletedForEveryone;

    // Time formatting
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Delete message
    const handleDelete = async (scope) => {
        try {
            await apiClient.delete(`/messages/${message._id}?scope=${scope}`);
            setShowPopup(false);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // --------------------------
    // 📁 FILE RENDERING LOGIC (IMPROVED)
    // --------------------------
    const renderFile = () => {
        if (!message.fileUrl) return null;

        const file = `http://localhost:5000${message.fileUrl}`;
        const fileName = message.fileUrl.split('/').pop();
        const ext = fileName.split('.').pop().toLowerCase();

        // IMAGE
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            return (
                <div className="file-message image-message" onClick={(e) => e.stopPropagation()}>
                    <img 
                        src={file} 
                        alt={fileName} 
                        className="chat-image" 
                        onClick={() => window.open(file, '_blank')}
                    />
                </div>
            );
        }

        // VIDEO
        if (["mp4", "webm", "mov", "avi"].includes(ext)) {
            return (
                <div className="file-message video-message" onClick={(e) => e.stopPropagation()}>
                    <video controls className="chat-video">
                        <source src={file} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        // PDF
        if (ext === "pdf") {
            return (
                <div className="file-message document-message" onClick={(e) => e.stopPropagation()}>
                    <div className="file-info" onClick={() => window.open(file, '_blank')} style={{cursor: 'pointer'}}>
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                            <span className="file-name">{fileName}</span>
                            <span className="file-type">PDF Document</span>
                        </div>
                    </div>
                </div>
            );
        }

        // DOCUMENTS (DOC, DOCX, PPT, etc.)
        if (["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(ext)) {
            return (
                <div className="file-message document-message" onClick={(e) => e.stopPropagation()}>
                    <div className="file-info" onClick={() => window.open(file, '_blank')} style={{cursor: 'pointer'}}>
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                            <span className="file-name">{fileName}</span>
                            <span className="file-type">Document</span>
                        </div>
                    </div>
                </div>
            );
        }

        // OTHER FILES (ZIP, etc.)
        return (
            <div className="file-message document-message" onClick={(e) => e.stopPropagation()}>
                <div className="file-info" onClick={() => window.open(file, '_blank')} style={{cursor: 'pointer'}}>
                    <span className="file-icon">📎</span>
                    <div className="file-details">
                        <span className="file-name">{fileName}</span>
                        <span className="file-type">File</span>
                    </div>
                </div>
            </div>
        );
    };

    // ----------------------------------
    // 🔥 VOICE MESSAGE RENDERING
    // ----------------------------------
    const isVoiceMsg = message.messageType === "audio" && message.audioUrl;

    const renderMessageContent = () => {
        // AUDIO
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
                    <source
                        src={`http://localhost:5000${message.audioUrl}`}
                        type="audio/webm"
                    />
                    <source
                        src={`http://localhost:5000${message.audioUrl}`}
                        type="audio/wav"
                    />
                    Your browser does not support the audio element.
                </audio>
            );
        }

        return message.message;
    };

    // ================================
    // DELETED FOR EVERYONE
    // ================================
    if (isDeletedForEveryone) {
        return (
            <div className={`message-wrapper ${fromMe ? "from-me" : "from-them"}`}>
                <div className={`message-bubble deleted ${fromMe ? "from-me" : "from-them"}`}>
                    <i>This message was deleted</i>
                </div>

                <div className={`message-time ${fromMe ? "from-me" : "from-them"}`}>
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

    // ================================
    // DELETED ONLY FOR ME
    // ================================
    if (iDeleted) {
        return (
            <div className={`message-wrapper ${fromMe ? "from-me" : "from-them"}`}>
                <div
                    className={`message-bubble deleted-for-me ${
                        fromMe ? "from-me" : "from-them"
                    }`}
                >
                    <i>You deleted this message</i>
                </div>

                <div className={`message-time ${fromMe ? "from-me" : "from-them"}`}>
                    <span>{formattedTime}</span>
                </div>
            </div>
        );
    }

    // ================================
    // NORMAL MESSAGE
    // ================================
    return (
        <>
            <div
                className={`message-wrapper ${fromMe ? "from-me" : "from-them"}`}
                onClick={() => setShowPopup(true)}
            >
                <div className={`message-bubble ${fromMe ? "from-me" : "from-them"}`}>
                    {/* TEXT OR AUDIO */}
                    {renderMessageContent()}

                    {/* FILE PREVIEW (ADDED FEATURE) */}
                    {renderFile()}
                </div>

                <div className={`message-time ${fromMe ? "from-me" : "from-them"}`}>
                    <span>{formattedTime}</span>

                    {fromMe && (
                        <span className="message-receipt">
                            <ReadReceipt status={message.status} />
                        </span>
                    )}
                </div>
            </div>

            {/* DELETE POPUP */}
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
                            onClick={() => handleDelete("me")}
                        >
                            Delete for me
                        </button>

                        {fromMe && (
                            <button
                                className="delete-popup-btn"
                                onClick={() => handleDelete("everyone")}
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

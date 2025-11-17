import React, { useState, useRef } from "react";
import useSendMessage from "../../hooks/useSendMessage.js";
import "../../styles/Chat.css";
import { useSocketContext } from "../../context/SocketContext.js";
import useConversation from "../../zustand/useConversation.js";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [file, setFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ⭐ NEW
    const mediaChunks = useRef([]);

    const { loading, sendMessage } = useSendMessage();
    const { socket } = useSocketContext();
    const { selectedConversation } = useConversation();

    // --------------------- AUDIO RECORDING ---------------------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                mediaChunks.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const recordedBlob = new Blob(mediaChunks.current, { type: "audio/webm" });
                setAudioBlob(recordedBlob);
                mediaChunks.current = [];
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecorder(mediaRecorder);
            setIsRecording(true);

        } catch (err) {
            console.error("Microphone error:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (recorder && isRecording) {
            recorder.stop();
            setIsRecording(false);

            if (socket) socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;

        try {
            await sendMessage({ type: "voice", audioBlob });
            setAudioBlob(null);
        } catch (error) {
            console.error("Failed to send audio message:", error);
        }
    };

    const cancelAudioMessage = () => {
        setAudioBlob(null);
    };

    // --------------------- FILE UPLOAD ---------------------
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // --------------------- SEND TEXT / FILE ---------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() && !file) return;

        if (socket) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }

        await sendMessage(message, file);

        setMessage("");
        setFile(null);
        setShowEmojiPicker(false);
    };

    // --------------------- TYPING EVENTS ---------------------
    const handleTyping = (e) => {
        setMessage(e.target.value);
        if (socket) socket.emit("typing", { receiverId: selectedConversation._id });
    };

    const handleStopTyping = () => {
        if (socket) socket.emit("stopTyping", { receiverId: selectedConversation._id });
    };

    // ⭐ ADD EMOJI TO TEXT
    const handleEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    return (
        <div className="message-input-container">

            {audioBlob ? (
                // --------------------- AUDIO PREVIEW ---------------------
                <div className="audio-preview-container">
                    <div className="audio-preview">
                        <audio
                            controls
                            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                            disablePictureInPicture
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                        </audio>
                    </div>

                    <div className="audio-preview-actions">
                        <button
                            type="button"
                            className="send-audio-button"
                            onClick={sendAudioMessage}
                            disabled={loading}
                        >
                            {loading ? "⋯" : "➤"}
                        </button>

                        <button
                            type="button"
                            className="cancel-audio-button"
                            onClick={cancelAudioMessage}
                        >
                            ✕
                        </button>
                    </div>
                </div>

            ) : (
                // --------------------- NORMAL CHAT INPUT ---------------------
                <form onSubmit={handleSubmit} className="message-input-form">

                    {/* FILE PREVIEW */}
                    {file && (
                        <div className="file-preview">
                            <div className="file-preview-info">
                                <span className="file-preview-icon">📎</span>
                                <span className="file-preview-name">{file.name}</span>
                                <span className="file-preview-size">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <button
                                    type="button"
                                    className="remove-file-button"
                                    onClick={() => setFile(null)}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ⭐ EMOJI BUTTON - LEFT SIDE */}
                    <button
                        type="button"
                        className="emoji-button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😀
                    </button>

                    {/* ⭐ EMOJI PICKER POPUP */}
                    {showEmojiPicker && (
                        <div className="emoji-picker-container">
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}

                    {/* TEXT INPUT */}
                    <input
                        type="text"
                        placeholder={file ? "Add a caption..." : "Type a message..."}
                        value={message}
                        onChange={handleTyping}
                        onBlur={handleStopTyping}
                        className="message-input"
                    />

                    {/* FILE UPLOAD */}
                    <label htmlFor="file-upload" className="file-upload-label">📎</label>
                    <input
                        id="file-upload"
                        type="file"
                        className="file-upload-input"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileChange}
                    />

                    {/* AUDIO RECORD */}
                    {!isRecording ? (
                        <button type="button" className="voice-button" onClick={startRecording}>
                            🎙️
                        </button>
                    ) : (
                        <button type="button" className="recording-stop-button" onClick={stopRecording}>
                            ⏹
                        </button>
                    )}

                    {/* SEND BUTTON */}
                    <button
                        type="submit"
                        disabled={loading || (!message.trim() && !file)}
                        className="send-button"
                    >
                        {loading ? "⋯" : "➤"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default MessageInput;

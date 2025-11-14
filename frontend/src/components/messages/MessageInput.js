import React, { useState, useRef } from "react";
import useSendMessage from "../../hooks/useSendMessage.js";
import "../../styles/Chat.css";
import { useSocketContext } from "../../context/SocketContext.js";
import useConversation from "../../zustand/useConversation.js";
import apiClient from '../../api/api.js';

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null); // Store recorded audio
    const mediaChunks = useRef([]);

    const { loading, sendMessage } = useSendMessage();
    const { socket } = useSocketContext();
    const { selectedConversation } = useConversation();

    // -------------------------------
    // 🔹 Start Recording Audio
    // -------------------------------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                mediaChunks.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const recordedBlob = new Blob(mediaChunks.current, { type: "audio/webm" });
                setAudioBlob(recordedBlob); // Store for preview
                mediaChunks.current = [];
                
                // Stop all tracks to release microphone
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

    // -------------------------------
    // 🔹 Stop Recording Audio
    // -------------------------------
    const stopRecording = () => {
        if (recorder && isRecording) {
            recorder.stop();
            setIsRecording(false);

            if (socket) socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }
    };

    // -------------------------------
    // 🔹 Send Audio Message
    // -------------------------------
    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        
        try {
            await sendMessage({ type: "voice", audioBlob });
            setAudioBlob(null); // Clear after sending
        } catch (error) {
            console.error("Failed to send audio message:", error);
        }
    };

    // -------------------------------
    // 🔹 Cancel Audio Message
    // -------------------------------
    const cancelAudioMessage = () => {
        setAudioBlob(null);
    };

    // -------------------------------
    // 🔹 Handle send text message
    // -------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        if (socket) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }

        await sendMessage(message); // sending normal text
        setMessage("");
    };

    // -------------------------------
    // 🔹 Typing Indicator
    // -------------------------------
    const handleTyping = (e) => {
        setMessage(e.target.value);

        if (socket) {
            socket.emit("typing", { receiverId: selectedConversation._id });
        }
    };

    const handleStopTyping = () => {
        if (socket) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }
    };

    return (
        <div className="message-input-container">
            {audioBlob ? (
                // Audio Preview Mode
                <div className="audio-preview-container">
                    <div className="audio-preview">
                        <audio 
                            controls
                            onContextMenu={(e) => e.preventDefault()}
                            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                            disablePictureInPicture
                            preload="metadata"
                        >
                            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div className="audio-preview-actions">
                        <button
                            type="button"
                            className="send-audio-button"
                            onClick={sendAudioMessage}
                            disabled={loading}
                            title="Send audio message"
                        >
                            {loading ? "⋯" : "➤"}
                        </button>
                        <button
                            type="button"
                            className="cancel-audio-button"
                            onClick={cancelAudioMessage}
                            title="Cancel audio message"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ) : (
                // Normal Message Input Mode
                <form onSubmit={handleSubmit} className="message-input-form">
                    {/* Text Input */}
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleTyping}
                        onBlur={handleStopTyping}
                        className="message-input"
                    />

                    {/* 🔴 Audio Record Button */}
                    {!isRecording ? (
                        <button
                            type="button"
                            className="voice-button"
                            onClick={startRecording}
                            title="Record voice message"
                        >
                            🎤
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="recording-stop-button"
                            onClick={stopRecording}
                            title="Stop recording"
                        >
                            ⏹
                        </button>
                    )}

                    {/* Text Send Button */}
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="send-button"
                        title="Send message"
                    >
                        {loading ? "⋯" : "➤"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default MessageInput;

// src/components/calls/VideoCall.js
import React, { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import "./Call.css";

const VideoCall = () => {
    const {
        incomingCall,
        acceptCall,
        endCall,
        onCallWith,
        isCallConnected,
        callStartTime,
        activeCallUserInfo,
        isMuted,
        toggleMute,
        callType,
        localStreamRef,
        remoteStreamRef,
    } = useSocketContext();
    const { selectedConversation } = useConversation();

    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach local video stream
    useEffect(() => {
        if (callType !== "video") return;
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callType, onCallWith, incomingCall, localStreamRef]);

    // Attach remote video stream
    useEffect(() => {
        if (callType !== "video") return;
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
    }, [callType, isCallConnected, remoteStreamRef]);

    // Timer
    useEffect(() => {
        let interval;
        if (onCallWith && callStartTime && callType === "video") {
            interval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - callStartTime) / 1000);
                setCallDuration(elapsed);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [onCallWith, callStartTime, callType]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const getContactInfo = (userId, callerInfo = null) => {
        if (callerInfo) {
            return {
                name: callerInfo.fullName || "Unknown User",
                initial: (callerInfo.fullName || "U").charAt(0).toUpperCase(),
            };
        }
        if (activeCallUserInfo) {
            return {
                name: activeCallUserInfo.fullName || "Unknown User",
                initial: (activeCallUserInfo.fullName || "U")
                    .charAt(0)
                    .toUpperCase(),
            };
        }
        if (selectedConversation && selectedConversation._id === userId) {
            return {
                name: selectedConversation.fullName,
                initial: selectedConversation.fullName.charAt(0).toUpperCase(),
            };
        }
        return {
            name: "Unknown User",
            initial: "U",
        };
    };

    // INCOMING VIDEO CALL
    if (incomingCall && (incomingCall.callType || "audio") === "video") {
        const caller = getContactInfo(incomingCall.from, incomingCall.callerInfo);

        return (
            <div className="call-overlay incoming-call">
                <div className="call-modal">
                    <div className="caller-info">
                        <div className="caller-avatar pulse">{caller.initial}</div>
                        <h3 className="caller-name">{caller.name}</h3>
                        <p className="call-status">🎥 Incoming video call...</p>
                        <p className="ringing-indicator">🔔 Ringing...</p>
                    </div>

                    <div className="call-actions">
                        <button
                            className="call-action-btn decline-btn"
                            onClick={() => endCall()}
                            title="Decline Call"
                        >
                            <span className="call-icon decline-icon">📞</span>
                        </button>

                        <button
                            className="call-action-btn accept-btn"
                            onClick={() => acceptCall()}
                            title="Accept Call"
                        >
                            <span className="call-icon accept-icon">📹</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ACTIVE VIDEO CALL
    if (onCallWith && callType === "video") {
        const contact = getContactInfo(onCallWith);

        return (
            <div className="call-overlay active-call">
                <div className="call-modal active video-call-modal">
                    <div className="video-area">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="remote-video"
                        />
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="local-video"
                        />
                    </div>

                    <div className="caller-info">
                        <h3 className="caller-name">{contact.name}</h3>
                        {isCallConnected ? (
                            <p className="call-duration">
                                {formatDuration(callDuration)}
                            </p>
                        ) : (
                            <p className="call-status">Connecting...</p>
                        )}
                        <p className="call-status">
                            {isCallConnected
                                ? "Video call in progress"
                                : "Waiting for connection..."}
                        </p>
                    </div>

                    <div className="call-controls">
                        <button
                            className={`call-control-btn mute-btn ${isMuted ? "muted" : ""
                                }`}
                            onClick={toggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? "🔇" : "🎤"}
                        </button>

                        <button
                            className="call-control-btn end-call-btn"
                            onClick={() => endCall()}
                            title="End Call"
                        >
                            📞
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default VideoCall;

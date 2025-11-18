import React, { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import './Call.css';

const AudioCall = () => {
    const { incomingCall, acceptCall, endCall, onCallWith, isCallConnected, callStartTime, activeCallUserInfo, isMuted, toggleMute } = useSocketContext();
    const { selectedConversation } = useConversation(); // Use selectedConversation instead
    const [callDuration, setCallDuration] = useState(0);

    // Debug logging with proper checks
    console.log('🎯 AudioCall component render:', {
        incomingCall: incomingCall ? `Call from: ${incomingCall.from}` : 'No incoming call',
        onCallWith: onCallWith ? `On call with: ${onCallWith}` : 'Not in call',
        isCallConnected: isCallConnected ? 'Connected' : 'Not connected',
        callStartTime: callStartTime ? new Date(callStartTime).toISOString() : 'No timer start',
        activeCallUserInfo: activeCallUserInfo ? activeCallUserInfo.fullName : 'No active call user info',
        selectedConversation: selectedConversation ? selectedConversation.fullName : 'None selected'
    });

    // Synchronized call duration timer - using server timestamp
    useEffect(() => {
        let interval;
        if (onCallWith && callStartTime) { // Only start timer when server sends start time
            interval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - callStartTime) / 1000);
                setCallDuration(elapsed);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [onCallWith, callStartTime]); // Watch call state and synchronized start time

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get contact info for the caller - use callerInfo from incoming call, activeCallUserInfo for active calls, or selectedConversation as fallback
    const getContactInfo = (userId, callerInfo = null) => {
        console.log('🔍 Getting contact info for userId:', userId, 'callerInfo:', callerInfo, 'activeCallUserInfo:', activeCallUserInfo);
        
        // For incoming calls, use the callerInfo sent by backend
        if (callerInfo) {
            console.log('✅ Using callerInfo for incoming call:', callerInfo);
            return {
                name: callerInfo.fullName || 'Unknown User',
                initial: (callerInfo.fullName || 'U').charAt(0).toUpperCase()
            };
        }

        // For active calls, use the stored activeCallUserInfo
        if (activeCallUserInfo) {
            console.log('✅ Using activeCallUserInfo for active call:', activeCallUserInfo);
            return {
                name: activeCallUserInfo.fullName || 'Unknown User',
                initial: (activeCallUserInfo.fullName || 'U').charAt(0).toUpperCase()
            };
        }

        // Fallback: use selectedConversation (the person we called or who called us)
        if (selectedConversation && selectedConversation._id === userId) {
            console.log('✅ Using selectedConversation as fallback:', selectedConversation);
            return {
                name: selectedConversation.fullName,
                initial: selectedConversation.fullName.charAt(0).toUpperCase()
            };
        }

        // Default fallback if no conversation data
        console.warn('❌ No user info found, using Unknown User for userId:', userId);
        return {
            name: 'Unknown User',
            initial: 'U'
        };
    };

    // INCOMING CALL INTERFACE
    if (incomingCall) {
        const caller = getContactInfo(incomingCall.from, incomingCall.callerInfo);
        
        return (
            <div className="call-overlay incoming-call">
                <div className="call-modal">
                    <div className="caller-info">
                        <div className="caller-avatar pulse">
                            {caller.initial}
                        </div>
                        <h3 className="caller-name">{caller.name}</h3>
                        <p className="call-status">📞 Incoming audio call...</p>
                        <p className="ringing-indicator">🔔 Ringing...</p>
                    </div>
                    
                    <div className="call-actions">
                        <button 
                            className="call-action-btn decline-btn" 
                            onClick={() => {
                                console.log('❌ User declined call');
                                endCall();
                            }}
                            title="Decline Call"
                        >
                            <span className="call-icon decline-icon">📞</span>
                        </button>
                        
                        <button 
                            className="call-action-btn accept-btn" 
                            onClick={() => {
                                console.log('✅ User accepted call');
                                acceptCall();
                            }}
                            title="Accept Call"
                        >
                            <span className="call-icon accept-icon">📞</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ACTIVE CALL INTERFACE
    if (onCallWith) {
        const contact = getContactInfo(onCallWith);
        
        return (
            <div className="call-overlay active-call">
                <div className="call-modal active">
                    <div className="caller-info">
                        <div className="caller-avatar active-pulse">
                            {contact.initial}
                        </div>
                        <h3 className="caller-name">{contact.name}</h3>
                        {isCallConnected ? (
                            <p className="call-duration">{formatDuration(callDuration)}</p>
                        ) : (
                            <p className="call-status">Connecting...</p>
                        )}
                        <p className="call-status">{isCallConnected ? 'On call' : 'Waiting for connection...'}</p>
                    </div>
                    
                    <div className="call-controls">
                        <button 
                            className={`call-control-btn mute-btn ${isMuted ? 'muted' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? '🔇' : '🎤'}
                        </button>
                        
                        <button 
                            className="call-control-btn end-call-btn" 
                            onClick={() => {
                                console.log('📴 User ended active call');
                                endCall();
                            }}
                            title="End Call"
                        >
                            📞
                        </button>
                        
                        <button 
                            className="call-control-btn speaker-btn"
                            title="Speaker"
                        >
                            🔊
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No call state
    return null;
};

export default AudioCall;
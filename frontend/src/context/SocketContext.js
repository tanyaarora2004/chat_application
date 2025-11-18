// src/context/SocketContext.js
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import useConversation from "../zustand/useConversation";

const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

// ⭐ WebRTC Peer Connection (global instance)
const createPeerConnection = () =>
    new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { authUser } = useAuthContext();
    const { setMessages, updateMessage, setAllMessagesAsSeenBy } = useConversation();

    // ⭐ AUDIO CALL STATES
    const [incomingCall, setIncomingCall] = useState(null);   // { from, offer }
    const [onCallWith, setOnCallWith] = useState(null);        // userId
    const [isCallConnected, setIsCallConnected] = useState(false); // NEW: tracks when call is actually connected
    const [callStartTime, setCallStartTime] = useState(null); // Synchronized timer start
    const [activeCallUserInfo, setActiveCallUserInfo] = useState(null); // Store caller info during active call
    const [isMuted, setIsMuted] = useState(false); // Mute state for audio calls
    const pcRef = useRef(null);
    const audioRef = useRef(null);
    const ringingAudioRef = useRef(null); // for incoming call ringing sound
    const localStreamRef = useRef(null);

    // -------------------------------------------------------
    //  SOCKET CONNECTION
    // -------------------------------------------------------
    useEffect(() => {
        if (!authUser) return;

        const newSocket = io("http://localhost:5000", {
            query: { userId: authUser._id },
        });

        setSocket(newSocket);

        // Initialize audio elements with enhanced settings
        audioRef.current = new Audio();
        audioRef.current.autoplay = true;
        audioRef.current.volume = 1.0;
        
        // Add audio processing for clearer voice
        try {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🎛️ Audio context initialized for voice enhancement');
            }
        } catch (e) {
            console.log('📢 Standard audio mode');
        }
        
        // Initialize ringing audio for incoming calls - using custom ringtone with consistent volume
        ringingAudioRef.current = new Audio();
        ringingAudioRef.current.loop = true;
        ringingAudioRef.current.volume = 0.8; // Higher volume for consistency
        ringingAudioRef.current.preload = 'auto';
        ringingAudioRef.current.crossOrigin = 'anonymous'; // Allow cross-origin audio
        
        // Use your custom ringtone
        ringingAudioRef.current.src = 'https://cdn.pixabay.com/download/audio/2025/07/18/audio_9dc60589a0.mp3?filename=ringtone-026-376909.mp3';
        
        console.log('🎵 Loading custom ringtone...');
        
        // Add volume control to maintain consistent levels
        const maintainVolume = () => {
            if (ringingAudioRef.current) {
                ringingAudioRef.current.volume = 0.8; // Reset to full volume
            }
        };
        
        // Monitor and maintain volume every second during playback
        const volumeInterval = setInterval(() => {
            if (ringingAudioRef.current && !ringingAudioRef.current.paused) {
                maintainVolume();
            }
        }, 500); // Check every 500ms
        
        // Store interval reference for cleanup
        ringingAudioRef.current.volumeInterval = volumeInterval;
        
        // Handle successful load
        ringingAudioRef.current.addEventListener('canplaythrough', () => {
            console.log('✅ Custom ringtone loaded successfully');
            // Ensure volume is set after loading
            maintainVolume();
        });
        
        // Prevent volume changes during playback
        ringingAudioRef.current.addEventListener('timeupdate', maintainVolume);
        ringingAudioRef.current.addEventListener('playing', maintainVolume);
        
        // Fallback if custom ringtone fails to load
        ringingAudioRef.current.addEventListener('error', (e) => {
            console.warn('⚠️ Custom ringtone failed to load, using backup:', e);
            
            // Clear volume interval
            if (ringingAudioRef.current.volumeInterval) {
                clearInterval(ringingAudioRef.current.volumeInterval);
            }
            
            // Create backup beep sound with consistent volume
            const createBackupBeep = () => {
                const frequency = 800;
                const duration = 2; // Longer duration for better looping
                const sampleRate = 22050;
                const samples = duration * sampleRate;
                
                const buffer = new ArrayBuffer(44 + samples * 2);
                const view = new DataView(buffer);
                
                // WAV header
                const writeString = (offset, string) => {
                    for (let i = 0; i < string.length; i++) {
                        view.setUint8(offset + i, string.charCodeAt(i));
                    }
                };
                
                writeString(0, 'RIFF');
                view.setUint32(4, 36 + samples * 2, true);
                writeString(8, 'WAVE');
                writeString(12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 1, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * 2, true);
                view.setUint16(32, 2, true);
                view.setUint16(34, 16, true);
                writeString(36, 'data');
                view.setUint32(40, samples * 2, true);
                
                // Generate consistent volume ringing pattern
                for (let i = 0; i < samples; i++) {
                    const t = i / sampleRate;
                    const cycle = t % 2; // 2-second cycle
                    let amplitude = 0;
                    
                    // Consistent amplitude throughout
                    if (cycle < 0.4 || (cycle > 0.6 && cycle < 1.0) || (cycle > 1.2 && cycle < 1.6)) {
                        amplitude = Math.sin(2 * Math.PI * frequency * t) * 0.6; // Consistent 0.6 amplitude
                    }
                    
                    view.setInt16(44 + i * 2, amplitude * 32767, true);
                }
                
                return new Blob([buffer], { type: 'audio/wav' });
            };
            
            const backupBlob = createBackupBeep();
            ringingAudioRef.current.src = URL.createObjectURL(backupBlob);
            console.log('📱 Using backup ringtone with consistent volume');
        });
        
        // Add a one-time user interaction handler to enable audio
        const enableAudio = () => {
            try {
                ringingAudioRef.current.muted = true;
                ringingAudioRef.current.play().then(() => {
                    ringingAudioRef.current.pause();
                    ringingAudioRef.current.muted = false;
                    ringingAudioRef.current.currentTime = 0;
                    console.log('🔓 Audio permissions enabled');
                    document.removeEventListener('click', enableAudio);
                    document.removeEventListener('touchstart', enableAudio);
                }).catch(() => {});
            } catch (e) {}
        };
        
        // Listen for first user interaction
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });

        newSocket.on("getOnlineUsers", setOnlineUsers);

        newSocket.on("newMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on("messageStatusUpdate", updateMessage);
        newSocket.on("messageDeleted", updateMessage);

        newSocket.on("messagesSeen", ({ otherUserId }) => {
            setAllMessagesAsSeenBy(otherUserId);
        });

        // -------------------------------------------------------
        //  🔥 AUDIO CALL EVENTS
        // -------------------------------------------------------

        // 1. Someone is calling you
        newSocket.on("incoming-call", async ({ from, offer, callerInfo }) => {
            console.log('📞 Incoming call from:', from, 'caller info:', callerInfo);
            setIncomingCall({ from, offer, callerInfo });
            
            // Start ringing sound with fallback handling
            console.log('🔊 Attempting to start ringing sound...');
            try {
                // Reset audio to ensure it's ready
                ringingAudioRef.current.currentTime = 0;
                ringingAudioRef.current.muted = false;
                
                const playPromise = ringingAudioRef.current.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    console.log('✅ Ringing sound started successfully');
                }
            } catch (error) {
                console.warn('⚠️ Autoplay blocked or audio failed:', error.message);
                
                // Show visual notification since audio failed
                console.log('📢 Showing visual notification instead');
                if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                        new Notification('📞 Incoming Call', {
                            body: `${callerInfo?.fullName || 'Someone'} is calling...`,
                            icon: '/favicon.ico',
                            tag: 'incoming-call'
                        });
                    } else if (Notification.permission === 'default') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification('📞 Incoming Call', {
                                    body: `${callerInfo?.fullName || 'Someone'} is calling...`,
                                    icon: '/favicon.ico',
                                    tag: 'incoming-call'
                                });
                            }
                        });
                    }
                }
                
                // Try device vibration
                if (navigator.vibrate) {
                    navigator.vibrate([500, 200, 500, 200, 500]);
                    console.log('📳 Device vibration activated');
                }
            }
        });

        // 2. Call accepted → add remote answer
        newSocket.on("call-accepted", async ({ answer }) => {
            console.log('✅ Call accepted, setting remote description');
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(answer);
            }
        });

        // 3. Receive ICE candidate
        newSocket.on("ice-candidate", async (candidate) => {
            console.log('🧊 ICE candidate received');
            try {
                await pcRef.current?.addIceCandidate(candidate);
            } catch (err) {
                console.error('❌ ICE candidate error:', err);
            }
        });

        // 4. Other user ended call
        newSocket.on("call-ended", () => {
            console.log('📴 Call ended by other user');
            // Stop ringing sound if playing
            if (ringingAudioRef.current) {
                ringingAudioRef.current.pause();
                ringingAudioRef.current.currentTime = 0;
            }
            endCall(); // Use local endCall, don't notify back
        });

        // 5. Synchronized timer start
        newSocket.on("call-timer-start", ({ startTime }) => {
            console.log('⏱️ Call timer synchronized start:', new Date(startTime));
            setCallStartTime(startTime);
        });

        return () => {
            newSocket.close();
            setSocket(null);
        };
    }, [authUser]);

    // -------------------------------------------------------
    //  🔥 CALLING FUNCTIONS
    // -------------------------------------------------------

    // ⭐ Mute/Unmute functions
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                console.log(audioTrack.enabled ? '🔊 Unmuted' : '🔇 Muted');
            }
        }
    };

    const mute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
                setIsMuted(true);
                console.log('🔇 Muted');
            }
        }
    };

    const unmute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = true;
                setIsMuted(false);
                console.log('🔊 Unmuted');
            }
        }
    };

    // ⭐ Stop ringing sound helper function
    const stopRingingSound = () => {
        if (ringingAudioRef.current) {
            ringingAudioRef.current.pause();
            ringingAudioRef.current.currentTime = 0;
            
            // Clear volume monitoring interval
            if (ringingAudioRef.current.volumeInterval) {
                clearInterval(ringingAudioRef.current.volumeInterval);
                ringingAudioRef.current.volumeInterval = null;
            }
            
            console.log('🔇 Ringing sound stopped');
            
            // Also mute temporarily to ensure it stops completely
            const originalVolume = ringingAudioRef.current.volume;
            ringingAudioRef.current.volume = 0;
            setTimeout(() => {
                if (ringingAudioRef.current) {
                    ringingAudioRef.current.volume = originalVolume;
                }
            }, 100);
        }
    };

    // ⭐ start call
    const startCall = async (receiverId) => {
        try {
            console.log('🔥 Starting call to:', receiverId);
            console.log('📡 Socket connected:', socket?.connected);
            
            if (!socket || !socket.connected) {
                console.error('❌ Socket not connected!');
                alert('Connection error. Please refresh the page and try again.');
                return;
            }
            
            // Check if already in call
            if (onCallWith || incomingCall) {
                console.warn('Already in call or receiving call');
                return;
            }

            pcRef.current = createPeerConnection();

            // 1. Get microphone with high-quality settings
            console.log('📱 Requesting high-quality microphone access...');
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    sampleSize: 16,
                    channelCount: 1,
                    volume: 1.0
                },
                video: false 
            });
            console.log('✅ High-quality microphone access granted');
            
            localStreamRef.current.getTracks().forEach((track) =>
                pcRef.current.addTrack(track, localStreamRef.current)
            );

            // 2. When remote user adds audio - CALL IS NOW CONNECTED with enhanced audio
            pcRef.current.ontrack = (event) => {
                console.log('🎧 Remote audio track received - Call Connected!');
                setIsCallConnected(true); // Mark call as connected when audio track is received
                if (audioRef.current) {
                    audioRef.current.srcObject = event.streams[0];
                    audioRef.current.volume = 1.0; // Ensure full volume
                    
                    // Enhance audio quality
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const source = audioContext.createMediaStreamSource(event.streams[0]);
                        const gainNode = audioContext.createGain();
                        gainNode.gain.value = 1.2; // Slightly boost audio
                        source.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        console.log('🔊 Audio enhancement applied');
                    } catch (e) {
                        console.log('📢 Using standard audio playback');
                    }
                }
            };

            // 3. ICE Candidate
            pcRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate');
                    socket.emit("ice-candidate", {
                        to: receiverId,
                        candidate: event.candidate,
                    });
                }
            };

            // 4. Create offer
            console.log('📋 Creating offer...');
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);

            // 5. send offer to other user with preferred audio codec
            console.log('📤 Sending call offer to:', receiverId);
            
            // Modify SDP to prefer high-quality audio codec
            const modifiedOffer = { ...offer };
            if (offer.sdp) {
                // Prefer Opus codec for better voice quality
                modifiedOffer.sdp = offer.sdp.replace(
                    /(m=audio \d+ [\w\/]+ )(.*)$/gm,
                    (match, prefix, codecs) => {
                        // Move Opus to the front for better quality
                        const codecList = codecs.split(' ');
                        const opusIndex = codecList.findIndex(c => c === '111'); // Opus usually has payload type 111
                        if (opusIndex > 0) {
                            const opus = codecList.splice(opusIndex, 1);
                            codecList.unshift(...opus);
                        }
                        return prefix + codecList.join(' ');
                    }
                );
            }
            
            socket.emit("call-user", { to: receiverId, offer: modifiedOffer });
            console.log('📤 Enhanced call offer sent successfully');

            setOnCallWith(receiverId);
            
            // Store the user info for the person we're calling (use selectedConversation)
            const { selectedConversation } = useConversation.getState();
            console.log('📝 Selected conversation for outgoing call:', selectedConversation);
            console.log('📝 Receiver ID we are calling:', receiverId);
            if (selectedConversation && selectedConversation._id === receiverId) {
                const userInfo = {
                    fullName: selectedConversation.fullName,
                    username: selectedConversation.username || 'user'
                };
                setActiveCallUserInfo(userInfo);
                console.log('📝 Stored user info for outgoing call:', userInfo);
            } else {
                console.warn('❌ No matching selectedConversation found for receiverId:', receiverId);
                console.warn('❌ selectedConversation._id:', selectedConversation?._id);
                console.warn('❌ receiverId:', receiverId);
            }
            
            console.log('✅ Call initiated successfully');
            
        } catch (error) {
            console.error('❌ Error starting call:', error);
            alert('Failed to start call: ' + error.message);
            endCall();
        }
    };

    // ⭐ accept incoming call
    const acceptCall = async () => {
        try {
            if (!incomingCall) {
                console.warn('No incoming call to accept');
                return;
            }
            
            const { from, offer } = incomingCall;
            console.log('📞 Accepting call from:', from);

            // Stop ringing sound
            stopRingingSound();

            pcRef.current = createPeerConnection();

            // 1. Add microphone with enhanced audio settings
            console.log('📱 Requesting high-quality microphone access...');
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    sampleSize: 16,
                    channelCount: 1,
                    volume: 1.0
                },
                video: false 
            });
            console.log('✅ High-quality microphone access granted');
            
            localStreamRef.current.getTracks().forEach((track) =>
                pcRef.current.addTrack(track, localStreamRef.current)
            );

            // 2. Play remote audio - CALL IS NOW CONNECTED with enhanced audio
            pcRef.current.ontrack = (event) => {
                console.log('🎧 Remote audio track received - Call Connected!');
                setIsCallConnected(true); // Mark call as connected when audio track is received
                if (audioRef.current) {
                    audioRef.current.srcObject = event.streams[0];
                    audioRef.current.volume = 1.0; // Ensure full volume
                    
                    // Enhance audio quality
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const source = audioContext.createMediaStreamSource(event.streams[0]);
                        const gainNode = audioContext.createGain();
                        gainNode.gain.value = 1.2; // Slightly boost audio
                        source.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        console.log('🔊 Audio enhancement applied');
                    } catch (e) {
                        console.log('📢 Using standard audio playback');
                    }
                }
            };

            // 3. ICE
            pcRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate');
                    socket.emit("ice-candidate", {
                        to: from,
                        candidate: event.candidate,
                    });
                }
            };

            // 4. Set caller's offer
            console.log('📋 Setting remote description...');
            await pcRef.current.setRemoteDescription(offer);

            // 5. Create answer
            console.log('📝 Creating answer...');
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            // 6. Send answer
            console.log('📤 Sending answer to caller');
            socket.emit("answer-call", {
                to: from,
                answer,
            });

            setOnCallWith(from);
            setActiveCallUserInfo(incomingCall.callerInfo); // Store caller info for active call
            console.log('📝 Stored caller info for active call:', incomingCall.callerInfo);
            setIncomingCall(null);
            console.log('✅ Call accepted successfully');
            
        } catch (error) {
            console.error('❌ Error accepting call:', error);
            alert('Failed to accept call: ' + error.message);
            endCall();
        }
    };

    // ⭐ end call
    const endCall = () => {
        console.log('📴 Ending call...');
        
        // Stop ringing sound
        stopRingingSound();
        
        try {
            localStreamRef.current?.getTracks().forEach((track) => track.stop());
            pcRef.current?.close();
        } catch {}

        localStreamRef.current = null;
        pcRef.current = null;
        setIncomingCall(null);
        setOnCallWith(null);
        setIsCallConnected(false); // Reset connection state
        setCallStartTime(null); // Reset timer
        setActiveCallUserInfo(null); // Reset call user info
        setIsMuted(false); // Reset mute state
        console.log('✅ Call ended locally');
    };

    // ⭐ notify the other user and end call
    const notifyEndCall = () => {
        console.log('📤 Notifying other user of call end...');
        
        // Notify the other user based on current state
        if (onCallWith && socket) {
            console.log('📤 Sending end-call to:', onCallWith);
            socket.emit("end-call", { to: onCallWith });
        } else if (incomingCall && socket) {
            console.log('📤 Declining call from:', incomingCall.from);
            socket.emit("end-call", { to: incomingCall.from });
        }
        
        endCall();
    };

    return (
        <SocketContext.Provider
            value={{
                socket,
                onlineUsers,

                // AUDIO CALL
                incomingCall,
                onCallWith,
                isCallConnected, // NEW: export connection state
                callStartTime, // Synchronized timer start
                activeCallUserInfo, // User info for active call
                isMuted, // Mute state
                toggleMute,
                mute,
                unmute,
                startCall,
                acceptCall,
                endCall: notifyEndCall,

                audioRef, // for remote audio output
            }}
        >
            {children}

            {/* 🔥 hidden audio element for remote audio */}
            <audio ref={audioRef} autoPlay />
        </SocketContext.Provider>
    );
};

// // src/context/SocketContext.js
// import { createContext, useState, useEffect, useContext, useRef } from "react";
// import { useAuthContext } from "./AuthContext";
// import io from "socket.io-client";
// import useConversation from "../zustand/useConversation";

// const SocketContext = createContext();
// export const useSocketContext = () => useContext(SocketContext);

// // ⭐ WebRTC Peer Connection (global instance)
// const createPeerConnection = () =>
//     new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

// export const SocketContextProvider = ({ children }) => {
//     const [socket, setSocket] = useState(null);
//     const [onlineUsers, setOnlineUsers] = useState([]);

//     const { authUser } = useAuthContext();
//     const { setMessages, updateMessage, setAllMessagesAsSeenBy } = useConversation();

//     // ⭐ CALL STATES
//     const [incomingCall, setIncomingCall] = useState(null);   // { from, offer, callerInfo, callType }
//     const [onCallWith, setOnCallWith] = useState(null);       // userId
//     const [isCallConnected, setIsCallConnected] = useState(false);
//     const [callStartTime, setCallStartTime] = useState(null);
//     const [activeCallUserInfo, setActiveCallUserInfo] = useState(null);
//     const [isMuted, setIsMuted] = useState(false);
//     const [callType, setCallType] = useState("audio");        // "audio" | "video"
//     const [remoteStreamUpdated, setRemoteStreamUpdated] = useState(0); // Counter to force re-renders
//     const pcRef = useRef(null);
//     const audioRef = useRef(null);
//     const ringingAudioRef = useRef(null);
//     const localStreamRef = useRef(null);      // local audio/video stream
//     const remoteStreamRef = useRef(null);     // remote audio/video stream

//     // -------------------------------------------------------
//     //  SOCKET CONNECTION
//     // -------------------------------------------------------
//     useEffect(() => {
//         if (!authUser) return;

//         const newSocket = io("http://localhost:5000", {
//             query: { userId: authUser._id },
//         });

//         setSocket(newSocket);

//         // Remote audio element
//         audioRef.current = new Audio();
//         audioRef.current.autoplay = true;
//         audioRef.current.volume = 1.0;

//         try {
//             if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
//                 const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//                 console.log("🎛️ Audio context initialized for voice enhancement");
//             }
//         } catch (e) {
//             console.log("📢 Standard audio mode");
//         }

//         // Ringing audio (same as your original code, unchanged except minor cleanup)
//         ringingAudioRef.current = new Audio();
//         ringingAudioRef.current.loop = true;
//         ringingAudioRef.current.volume = 0.8;
//         ringingAudioRef.current.preload = "auto";
//         ringingAudioRef.current.crossOrigin = "anonymous";
//         ringingAudioRef.current.src =
//             "https://cdn.pixabay.com/download/audio/2025/07/18/audio_9dc60589a0.mp3?filename=ringtone-026-376909.mp3";

//         const maintainVolume = () => {
//             if (ringingAudioRef.current) {
//                 ringingAudioRef.current.volume = 0.8;
//             }
//         };

//         const volumeInterval = setInterval(() => {
//             if (ringingAudioRef.current && !ringingAudioRef.current.paused) {
//                 maintainVolume();
//             }
//         }, 500);

//         ringingAudioRef.current.volumeInterval = volumeInterval;

//         ringingAudioRef.current.addEventListener("canplaythrough", () => {
//             console.log("✅ Custom ringtone loaded successfully");
//             maintainVolume();
//         });

//         ringingAudioRef.current.addEventListener("timeupdate", maintainVolume);
//         ringingAudioRef.current.addEventListener("playing", maintainVolume);

//         ringingAudioRef.current.addEventListener("error", (e) => {
//             console.warn("⚠️ Custom ringtone failed to load, using backup:", e);

//             if (ringingAudioRef.current.volumeInterval) {
//                 clearInterval(ringingAudioRef.current.volumeInterval);
//             }

//             // simple backup beep
//             const createBackupBeep = () => {
//                 const frequency = 800;
//                 const duration = 2;
//                 const sampleRate = 22050;
//                 const samples = duration * sampleRate;

//                 const buffer = new ArrayBuffer(44 + samples * 2);
//                 const view = new DataView(buffer);

//                 const writeString = (offset, string) => {
//                     for (let i = 0; i < string.length; i++) {
//                         view.setUint8(offset + i, string.charCodeAt(i));
//                     }
//                 };

//                 writeString(0, "RIFF");
//                 view.setUint32(4, 36 + samples * 2, true);
//                 writeString(8, "WAVE");
//                 writeString(12, "fmt ");
//                 view.setUint32(16, 16, true);
//                 view.setUint16(20, 1, true);
//                 view.setUint16(22, 1, true);
//                 view.setUint32(24, sampleRate, true);
//                 view.setUint32(28, sampleRate * 2, true);
//                 view.setUint16(32, 2, true);
//                 view.setUint16(34, 16, true);
//                 writeString(36, "data");
//                 view.setUint32(40, samples * 2, true);

//                 for (let i = 0; i < samples; i++) {
//                     const t = i / sampleRate;
//                     const cycle = t % 2;
//                     let amplitude = 0;
//                     if (
//                         cycle < 0.4 ||
//                         (cycle > 0.6 && cycle < 1.0) ||
//                         (cycle > 1.2 && cycle < 1.6)
//                     ) {
//                         amplitude = Math.sin(2 * Math.PI * frequency * t) * 0.6;
//                     }
//                     view.setInt16(44 + i * 2, amplitude * 32767, true);
//                 }

//                 return new Blob([buffer], { type: "audio/wav" });
//             };

//             const backupBlob = createBackupBeep();
//             ringingAudioRef.current.src = URL.createObjectURL(backupBlob);
//             console.log("📱 Using backup ringtone with consistent volume");
//         });

//         const enableAudio = () => {
//             try {
//                 ringingAudioRef.current.muted = true;
//                 ringingAudioRef.current
//                     .play()
//                     .then(() => {
//                         ringingAudioRef.current.pause();
//                         ringingAudioRef.current.muted = false;
//                         ringingAudioRef.current.currentTime = 0;
//                         console.log("🔓 Audio permissions enabled");
//                         document.removeEventListener("click", enableAudio);
//                         document.removeEventListener("touchstart", enableAudio);
//                     })
//                     .catch(() => {});
//             } catch (e) {}
//         };

//         document.addEventListener("click", enableAudio, { once: true });
//         document.addEventListener("touchstart", enableAudio, { once: true });

//         newSocket.on("getOnlineUsers", setOnlineUsers);

//         newSocket.on("newMessage", (message) => {
//             setMessages((prev) => [...prev, message]);
//         });

//         newSocket.on("messageStatusUpdate", updateMessage);
//         newSocket.on("messageDeleted", updateMessage);

//         newSocket.on("messagesSeen", ({ otherUserId }) => {
//             setAllMessagesAsSeenBy(otherUserId);
//         });

//         // -------------------------------------------------------
//         //  🔥 CALL EVENTS (audio + video)
//         // -------------------------------------------------------

//         // 1. Incoming call (audio OR video)
//         newSocket.on("incoming-call", async ({ from, offer, callerInfo, callType }) => {
//             const type = callType || "audio";
//             console.log("📞 Incoming", type, "call from:", from, "caller info:", callerInfo);
//             setCallType(type);
//             setIncomingCall({ from, offer, callerInfo, callType: type });

//             console.log("🔊 Attempting to start ringing sound...");
//             try {
//                 ringingAudioRef.current.currentTime = 0;
//                 ringingAudioRef.current.muted = false;

//                 const playPromise = ringingAudioRef.current.play();
//                 if (playPromise !== undefined) {
//                     await playPromise;
//                     console.log("✅ Ringing sound started successfully");
//                 }
//             } catch (error) {
//                 console.warn("⚠️ Autoplay blocked or audio failed:", error.message);
//                 if ("Notification" in window) {
//                     if (Notification.permission === "granted") {
//                         new Notification("📞 Incoming Call", {
//                             body: `${callerInfo?.fullName || "Someone"} is calling...`,
//                             icon: "/favicon.ico",
//                             tag: "incoming-call",
//                         });
//                     } else if (Notification.permission === "default") {
//                         Notification.requestPermission().then((permission) => {
//                             if (permission === "granted") {
//                                 new Notification("📞 Incoming Call", {
//                                     body: `${callerInfo?.fullName || "Someone"} is calling...`,
//                                     icon: "/favicon.ico",
//                                     tag: "incoming-call",
//                                 });
//                             }
//                         });
//                     }
//                 }
//                 if (navigator.vibrate) {
//                     navigator.vibrate([500, 200, 500, 200, 500]);
//                     console.log("📳 Device vibration activated");
//                 }
//             }
//         });

//         // 2. Call accepted
//         newSocket.on("call-accepted", async ({ answer, callType }) => {
//             console.log("✅ Call accepted, setting remote description");
//             if (callType) setCallType(callType);
//             if (pcRef.current) {
//                 await pcRef.current.setRemoteDescription(answer);
//             }
//         });

//         // 3. ICE candidate
//         newSocket.on("ice-candidate", async (candidate) => {
//             console.log("🧊 ICE candidate received");
//             try {
//                 await pcRef.current?.addIceCandidate(candidate);
//             } catch (err) {
//                 console.error("❌ ICE candidate error:", err);
//             }
//         });

//         // 4. Other user ended call
//         newSocket.on("call-ended", () => {
//             console.log("📴 Call ended by other user");
//             if (ringingAudioRef.current) {
//                 ringingAudioRef.current.pause();
//                 ringingAudioRef.current.currentTime = 0;
//             }
//             endCall();
//         });

//         // 5. Synchronized timer start
//         newSocket.on("call-timer-start", ({ startTime }) => {
//             console.log("⏱️ Call timer synchronized start:", new Date(startTime));
//             setCallStartTime(startTime);
//         });

//         return () => {
//             newSocket.close();
//             setSocket(null);
//         };
//     }, [authUser, setAllMessagesAsSeenBy, setMessages, updateMessage]);

//     // -------------------------------------------------------
//     //  🔥 CALLING FUNCTIONS
//     // -------------------------------------------------------

//     // mute helpers
//     const toggleMute = () => {
//         if (localStreamRef.current) {
//             const audioTrack = localStreamRef.current.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = !audioTrack.enabled;
//                 setIsMuted(!audioTrack.enabled);
//                 console.log(audioTrack.enabled ? "🔊 Unmuted" : "🔇 Muted");
//             }
//         }
//     };

//     const mute = () => {
//         if (localStreamRef.current) {
//             const audioTrack = localStreamRef.current.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = false;
//                 setIsMuted(true);
//                 console.log("🔇 Muted");
//             }
//         }
//     };

//     const unmute = () => {
//         if (localStreamRef.current) {
//             const audioTrack = localStreamRef.current.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = true;
//                 setIsMuted(false);
//                 console.log("🔊 Unmuted");
//             }
//         }
//     };

//     const stopRingingSound = () => {
//         if (ringingAudioRef.current) {
//             ringingAudioRef.current.pause();
//             ringingAudioRef.current.currentTime = 0;

//             if (ringingAudioRef.current.volumeInterval) {
//                 clearInterval(ringingAudioRef.current.volumeInterval);
//                 ringingAudioRef.current.volumeInterval = null;
//             }

//             console.log("🔇 Ringing sound stopped");
//             const originalVolume = ringingAudioRef.current.volume;
//             ringingAudioRef.current.volume = 0;
//             setTimeout(() => {
//                 if (ringingAudioRef.current) {
//                     ringingAudioRef.current.volume = originalVolume;
//                 }
//             }, 100);
//         }
//     };

//     // ⭐ start call (audio OR video)
//     const startCall = async (receiverId, type = "audio") => {
//         try {
//             console.log("🔥 Starting", type, "call to:", receiverId);
//             console.log("📡 Socket connected:", socket?.connected);

//             if (!socket || !socket.connected) {
//                 console.error("❌ Socket not connected!");
//                 alert("Connection error. Please refresh the page and try again.");
//                 return;
//             }

//             if (onCallWith || incomingCall) {
//                 console.warn("Already in call or receiving call");
//                 return;
//             }

//             setCallType(type);
//             pcRef.current = createPeerConnection();

//             const isVideo = type === "video";

//             // getUserMedia for audio-only or audio+video
//             localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     autoGainControl: true,
//                     sampleRate: 44100,
//                     sampleSize: 16,
//                     channelCount: 1,
//                     volume: 1.0,
//                 },
//                 video: isVideo,
//             });
//             console.log("✅ Media access granted (type:", type, ")");

//             localStreamRef.current.getTracks().forEach((track) =>
//                 pcRef.current.addTrack(track, localStreamRef.current)
//             );

//             pcRef.current.ontrack = (event) => {
//                 console.log("🎧 Remote track received:", event.track.kind, "- Call Connected!");
//                 const stream = event.streams[0];
                
//                 if (!remoteStreamRef.current) {
//                     remoteStreamRef.current = new MediaStream();
//                 }
                
//                 // Add the track to remote stream
//                 remoteStreamRef.current.addTrack(event.track);
//                 console.log("📹 Remote stream now has", remoteStreamRef.current.getTracks().length, "tracks");
                
//                 // Mark call as connected when we receive any track
//                 setIsCallConnected(true);

//                 // For audio track or audio-only calls, set up audio playback
//                 if (event.track.kind === 'audio' && audioRef.current) {
//                     audioRef.current.srcObject = stream;
//                     audioRef.current.volume = 1.0;
//                     try {
//                         const audioContext = new (window.AudioContext ||
//                             window.webkitAudioContext)();
//                         const source = audioContext.createMediaStreamSource(stream);
//                         const gainNode = audioContext.createGain();
//                         gainNode.gain.value = 1.2;
//                         source.connect(gainNode);
//                         gainNode.connect(audioContext.destination);
//                         console.log("🔊 Audio enhancement applied");
//                     } catch (e) {
//                         console.log("📢 Using standard audio playback");
//                     }
//                 }
                
//                 // For video tracks, force a state update to trigger re-render
//                 if (event.track.kind === 'video') {
//                     console.log("📹 Video track received, triggering UI update");
//                     // Force re-render by updating a state
//                     setCallType(prev => prev); 
//                 }
//             };

//             pcRef.current.onicecandidate = (event) => {
//                 if (event.candidate) {
//                     console.log("🧊 Sending ICE candidate");
//                     socket.emit("ice-candidate", {
//                         to: receiverId,
//                         candidate: event.candidate,
//                     });
//                 }
//             };

//             console.log("📋 Creating offer...");
//             const offer = await pcRef.current.createOffer();
//             await pcRef.current.setLocalDescription(offer);

//             const modifiedOffer = { ...offer };
//             if (offer.sdp) {
//                 modifiedOffer.sdp = offer.sdp.replace(
//                     /(m=audio \d+ [\w\/]+ )(.*)$/gm,
//                     (match, prefix, codecs) => {
//                         const codecList = codecs.split(" ");
//                         const opusIndex = codecList.findIndex((c) => c === "111");
//                         if (opusIndex > 0) {
//                             const opus = codecList.splice(opusIndex, 1);
//                             codecList.unshift(...opus);
//                         }
//                         return prefix + codecList.join(" ");
//                     }
//                 );
//             }

//             socket.emit("call-user", {
//                 to: receiverId,
//                 offer: modifiedOffer,
//                 callType: type, // ⭐ send type
//             });
//             console.log("📤 Call offer sent successfully (type:", type, ")");

//             setOnCallWith(receiverId);

//             const { selectedConversation } = useConversation.getState();
//             if (selectedConversation && selectedConversation._id === receiverId) {
//                 const userInfo = {
//                     fullName: selectedConversation.fullName,
//                     username: selectedConversation.username || "user",
//                 };
//                 setActiveCallUserInfo(userInfo);
//             }

//             console.log("✅ Call initiated successfully");
//         } catch (error) {
//             console.error("❌ Error starting call:", error);
//             alert("Failed to start call: " + error.message);
//             endCall();
//         }
//     };

//     // ⭐ accept incoming call (audio OR video)
//     const acceptCall = async () => {
//         try {
//             if (!incomingCall) {
//                 console.warn("No incoming call to accept");
//                 return;
//             }

//             const { from, offer, callType: incomingType } = incomingCall;
//             const type = incomingType || "audio";
//             setCallType(type);
//             console.log("📞 Accepting", type, "call from:", from);

//             stopRingingSound();

//             pcRef.current = createPeerConnection();

//             const isVideo = type === "video";

//             localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     autoGainControl: true,
//                     sampleRate: 44100,
//                     sampleSize: 16,
//                     channelCount: 1,
//                     volume: 1.0,
//                 },
//                 video: isVideo,
//             });
//             console.log("✅ Media access granted for", type, "call");

//             localStreamRef.current.getTracks().forEach((track) =>
//                 pcRef.current.addTrack(track, localStreamRef.current)
//             );

//             pcRef.current.ontrack = (event) => {
//                 console.log("🎧 Remote track received:", event.track.kind, "- Call Connected!");
//                 const stream = event.streams[0];
                
//                 if (!remoteStreamRef.current) {
//                     remoteStreamRef.current = new MediaStream();
//                 }
                
//                 // Add the track to remote stream
//                 remoteStreamRef.current.addTrack(event.track);
//                 console.log("📹 Remote stream now has", remoteStreamRef.current.getTracks().length, "tracks");
                
//                 // Mark call as connected when we receive any track
//                 setIsCallConnected(true);

//                 // For audio track or audio-only calls, set up audio playback
//                 if (event.track.kind === 'audio' && audioRef.current) {
//                     audioRef.current.srcObject = stream;
//                     audioRef.current.volume = 1.0;
//                     try {
//                         const audioContext = new (window.AudioContext ||
//                             window.webkitAudioContext)();
//                         const source = audioContext.createMediaStreamSource(stream);
//                         const gainNode = audioContext.createGain();
//                         gainNode.gain.value = 1.2;
//                         source.connect(gainNode);
//                         gainNode.connect(audioContext.destination);
//                         console.log("🔊 Audio enhancement applied");
//                     } catch (e) {
//                         console.log("📢 Using standard audio playback");
//                     }
//                 }
                
//                 // For video tracks, force a state update to trigger re-render
//                 if (event.track.kind === 'video') {
//                     console.log("📹 Video track received, triggering UI update");
//                     // Force re-render by updating a state
//                     setCallType(prev => prev);
//                 }
//             };

//             pcRef.current.onicecandidate = (event) => {
//                 if (event.candidate) {
//                     console.log("🧊 Sending ICE candidate");
//                     socket.emit("ice-candidate", {
//                         to: from,
//                         candidate: event.candidate,
//                     });
//                 }
//             };

//             console.log("📋 Setting remote description...");
//             await pcRef.current.setRemoteDescription(offer);

//             console.log("📝 Creating answer...");
//             const answer = await pcRef.current.createAnswer();
//             await pcRef.current.setLocalDescription(answer);

//             console.log("📤 Sending answer to caller");
//             socket.emit("answer-call", {
//                 to: from,
//                 answer,
//                 callType: type, // ⭐ send type back
//             });

//             setOnCallWith(from);
//             setActiveCallUserInfo(incomingCall.callerInfo);
//             setIncomingCall(null);
//             console.log("✅ Call accepted successfully");
//         } catch (error) {
//             console.error("❌ Error accepting call:", error);
//             alert("Failed to accept call: " + error.message);
//             endCall();
//         }
//     };

//     // ⭐ end call (local cleanup)
//     const endCall = () => {
//         console.log("📴 Ending call...");

//         stopRingingSound();

//         try {
//             localStreamRef.current?.getTracks().forEach((track) => track.stop());
//             remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
//             pcRef.current?.close();
//         } catch {}

//         localStreamRef.current = null;
//         remoteStreamRef.current = null;
//         pcRef.current = null;

//         setIncomingCall(null);
//         setOnCallWith(null);
//         setIsCallConnected(false);
//         setCallStartTime(null);
//         setActiveCallUserInfo(null);
//         setIsMuted(false);
//         setCallType("audio"); // reset default
//         console.log("✅ Call ended locally");
//     };

//     // ⭐ notify other user and end
//     const notifyEndCall = () => {
//         console.log("📤 Notifying other user of call end...");

//         if (onCallWith && socket) {
//             console.log("📤 Sending end-call to:", onCallWith);
//             socket.emit("end-call", { to: onCallWith, callType });
//         } else if (incomingCall && socket) {
//             console.log("📤 Declining call from:", incomingCall.from);
//             socket.emit("end-call", { to: incomingCall.from, callType: incomingCall.callType });
//         }

//         endCall();
//     };

//     return (
//         <SocketContext.Provider
//             value={{
//                 socket,
//                 onlineUsers,

//                 // CALL STATE
//                 incomingCall,
//                 onCallWith,
//                 isCallConnected,
//                 callStartTime,
//                 activeCallUserInfo,
//                 isMuted,
//                 callType,

//                 // audio functions
//                 toggleMute,
//                 mute,
//                 unmute,

//                 // call actions
//                 startCall,    // now supports (id, "audio" | "video")
//                 acceptCall,
//                 endCall: notifyEndCall,

//                 // media refs
//                 audioRef,          // remote audio output
//                 localStreamRef,    // local audio/video stream
//                 remoteStreamRef,   // remote audio/video stream
//             }}
//         >
//             {children}
//             {/* hidden audio element */}
//             <audio ref={audioRef} autoPlay />
//         </SocketContext.Provider>
//     );
// };
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import useConversation from "../zustand/useConversation";

const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

const createPeerConnection = () =>
    new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const { setMessages, updateMessage, setAllMessagesAsSeenBy } = useConversation();

    // CALL STATES
    const [incomingCall, setIncomingCall] = useState(null);
    const [onCallWith, setOnCallWith] = useState(null);
    const [isCallConnected, setIsCallConnected] = useState(false);
    const [callStartTime, setCallStartTime] = useState(null);
    const [activeCallUserInfo, setActiveCallUserInfo] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [callType, setCallType] = useState(null); 
    
    // ⭐ Forces VideoCall.js to re-render when a stream is finally ready
    const [streamTick, setStreamTick] = useState(0);

    const pcRef = useRef(null);
    const audioRef = useRef(null);
    const ringingAudioRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);

    useEffect(() => {
        if (!authUser) return;

        const newSocket = io("http://localhost:5000", {
            query: { userId: authUser._id },
        });
        setSocket(newSocket);

        // Setup Remote Audio
        audioRef.current = new Audio();
        audioRef.current.autoplay = true;

        // Setup Ringing
        ringingAudioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2025/07/18/audio_9dc60589a0.mp3?filename=ringtone-026-376909.mp3");
        ringingAudioRef.current.loop = true;

        // ⭐ FIX: UNLOCK AUDIO (Prevents play() failed error)
        const unlockAudio = () => {
            if (ringingAudioRef.current) {
                ringingAudioRef.current.play().then(() => {
                    ringingAudioRef.current.pause();
                    ringingAudioRef.current.currentTime = 0;
                    console.log("🔓 Audio system unlocked via user interaction");
                    document.removeEventListener("click", unlockAudio);
                }).catch(() => {});
            }
        };
        document.addEventListener("click", unlockAudio);

        // SOCKET LISTENERS
        newSocket.on("getOnlineUsers", setOnlineUsers);
        newSocket.on("newMessage", (message) => setMessages((prev) => [...prev, message]));

        newSocket.on("incoming-call", async ({ from, offer, callerInfo, callType: type }) => {
            console.log("📞 Incoming", type, "call");
            setCallType(type);
            setIncomingCall({ from, offer, callerInfo, callType: type });

            // Attempt to play ringtone (will work if user clicked anywhere earlier)
            ringingAudioRef.current?.play().catch(() => console.warn("🔊 Sound blocked: User hasn't interacted yet."));
        });

        newSocket.on("call-accepted", async ({ answer, callType: acceptedType }) => {
            if (acceptedType) setCallType(acceptedType);
            if (pcRef.current) await pcRef.current.setRemoteDescription(answer);
        });

        newSocket.on("ice-candidate", async (candidate) => {
            try { await pcRef.current?.addIceCandidate(candidate); } catch (e) {}
        });

        newSocket.on("call-ended", () => endCall());
        newSocket.on("call-timer-start", ({ startTime }) => setCallStartTime(startTime));

        return () => {
            document.removeEventListener("click", unlockAudio);
            newSocket.close();
        };
    }, [authUser]);

    const startCall = async (receiverId, type = "audio") => {
        try {
            setCallType(type);
            pcRef.current = createPeerConnection();
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video",
            });
            localStreamRef.current = stream;
            stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

            pcRef.current.ontrack = (event) => {
                console.log("🎬 Remote track received");
                remoteStreamRef.current = event.streams[0];
                
                // ⭐ Attach audio stream for playback
                if (audioRef.current && remoteStreamRef.current) {
                    audioRef.current.srcObject = remoteStreamRef.current;
                    audioRef.current.play().catch(e => console.log("🔊 Audio play:", e.message));
                }
                
                setIsCallConnected(true);
                setStreamTick(prev => prev + 1); // ⭐ Nudge the Video UI
            };

            pcRef.current.onicecandidate = (e) => {
                if (e.candidate) socket.emit("ice-candidate", { to: receiverId, candidate: e.candidate });
            };

            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socket.emit("call-user", { to: receiverId, offer, callType: type });
            setOnCallWith(receiverId);
            
            const { selectedConversation } = useConversation.getState();
            setActiveCallUserInfo(selectedConversation);
        } catch (error) {
            console.error(error);
            endCall();
        }
    };

    const acceptCall = async () => {
        try {
            if (!incomingCall) return;
            const { from, offer, callType: type } = incomingCall;
            setCallType(type);
            ringingAudioRef.current?.pause();

            pcRef.current = createPeerConnection();
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video",
            });
            localStreamRef.current = stream;
            stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

            pcRef.current.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0];
                
                // ⭐ Attach audio stream for playback
                if (audioRef.current && remoteStreamRef.current) {
                    audioRef.current.srcObject = remoteStreamRef.current;
                    audioRef.current.play().catch(e => console.log("🔊 Audio play:", e.message));
                }
                
                setIsCallConnected(true);
                setStreamTick(prev => prev + 1); // ⭐ Nudge the Video UI
            };

            pcRef.current.onicecandidate = (e) => {
                if (e.candidate) socket.emit("ice-candidate", { to: from, candidate: e.candidate });
            };

            await pcRef.current.setRemoteDescription(offer);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            socket.emit("answer-call", { to: from, answer, callType: type });
            setOnCallWith(from);
            setActiveCallUserInfo(incomingCall.callerInfo);
            setIncomingCall(null);
        } catch (error) {
            console.error(error);
            endCall();
        }
    };

    const endCall = () => {
        ringingAudioRef.current?.pause();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        setIncomingCall(null);
        setOnCallWith(null);
        setIsCallConnected(false);
        setCallStartTime(null);
        setCallType(null);
    };

    const notifyEndCall = () => {
        const target = onCallWith || incomingCall?.from;
        if (target) socket.emit("end-call", { to: target });
        endCall();
    };

    return (
        <SocketContext.Provider value={{
            socket, onlineUsers, incomingCall, onCallWith, isCallConnected,
            callStartTime, activeCallUserInfo, isMuted, callType,
            startCall, acceptCall, endCall: notifyEndCall, toggleMute: () => setIsMuted(!isMuted),
            localStreamRef, remoteStreamRef, streamTick
        }}>
            {children}
        </SocketContext.Provider>
    );
};
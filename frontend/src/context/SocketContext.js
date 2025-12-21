import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import useConversation from "../zustand/useConversation";

const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

// ----------------------
// WebRTC Peer Connection
// ----------------------
const createPeerConnection = () =>
    new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const { setMessages } = useConversation();

    // CALL STATES
    const [incomingCall, setIncomingCall] = useState(null);
    const [onCallWith, setOnCallWith] = useState(null);
    const [isCallConnected, setIsCallConnected] = useState(false);
    const [callStartTime, setCallStartTime] = useState(null);
    const [activeCallUserInfo, setActiveCallUserInfo] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [callType, setCallType] = useState(null);

    // Forces Video UI re-render
    const [streamTick, setStreamTick] = useState(0);

    const pcRef = useRef(null);
    const audioRef = useRef(null);
    const ringingAudioRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);

    // ----------------------
    // SOCKET CONNECTION
    // ----------------------
    useEffect(() => {
        if (!authUser || !authUser._id) return;

        const SOCKET_URL =
            process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

        const newSocket = io(SOCKET_URL, {
            query: { userId: authUser._id },
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        setSocket(newSocket);

        // Audio setup
        audioRef.current = new Audio();
        audioRef.current.autoplay = true;

        ringingAudioRef.current = new Audio(
            "https://cdn.pixabay.com/download/audio/2025/07/18/audio_9dc60589a0.mp3?filename=ringtone-026-376909.mp3"
        );
        ringingAudioRef.current.loop = true;

        // 🔓 Unlock audio on first click
        const unlockAudio = () => {
            ringingAudioRef.current?.play().then(() => {
                ringingAudioRef.current.pause();
                ringingAudioRef.current.currentTime = 0;
                document.removeEventListener("click", unlockAudio);
            }).catch(() => {});
        };
        document.addEventListener("click", unlockAudio);

        // ----------------------
        // SOCKET LISTENERS
        // ----------------------
        newSocket.on("getOnlineUsers", setOnlineUsers);

        newSocket.on("newMessage", (message) =>
            setMessages((prev) => [...prev, message])
        );

        newSocket.on("incoming-call", ({ from, offer, callerInfo, callType }) => {
            setCallType(callType);
            setIncomingCall({ from, offer, callerInfo, callType });
            ringingAudioRef.current?.play().catch(() => {});
        });

        newSocket.on("call-accepted", async ({ answer, callType }) => {
            if (callType) setCallType(callType);
            await pcRef.current?.setRemoteDescription(answer);
        });

        newSocket.on("ice-candidate", async (candidate) => {
            try {
                await pcRef.current?.addIceCandidate(candidate);
            } catch {}
        });

        newSocket.on("call-ended", endCall);
        newSocket.on("call-timer-start", ({ startTime }) =>
            setCallStartTime(startTime)
        );

        return () => {
            document.removeEventListener("click", unlockAudio);
            newSocket.disconnect();
        };
    }, [authUser]);

    // ----------------------
    // START CALL
    // ----------------------
    const startCall = async (receiverId, type = "audio") => {
        try {
            setCallType(type);
            pcRef.current = createPeerConnection();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video",
            });

            localStreamRef.current = stream;
            stream.getTracks().forEach((t) =>
                pcRef.current.addTrack(t, stream)
            );

            pcRef.current.ontrack = (e) => {
                remoteStreamRef.current = e.streams[0];
                audioRef.current.srcObject = remoteStreamRef.current;
                audioRef.current.play().catch(() => {});
                setIsCallConnected(true);
                setStreamTick((p) => p + 1);
            };

            pcRef.current.onicecandidate = (e) => {
                if (e.candidate)
                    socket.emit("ice-candidate", {
                        to: receiverId,
                        candidate: e.candidate,
                    });
            };

            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);

            socket.emit("call-user", { to: receiverId, offer, callType: type });
            setOnCallWith(receiverId);

            const { selectedConversation } = useConversation.getState();
            setActiveCallUserInfo(selectedConversation);
        } catch (err) {
            console.error(err);
            endCall();
        }
    };

    // ----------------------
    // ACCEPT CALL
    // ----------------------
    const acceptCall = async () => {
        try {
            if (!incomingCall) return;

            const { from, offer, callType } = incomingCall;
            setCallType(callType);
            ringingAudioRef.current?.pause();

            pcRef.current = createPeerConnection();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === "video",
            });

            localStreamRef.current = stream;
            stream.getTracks().forEach((t) =>
                pcRef.current.addTrack(t, stream)
            );

            pcRef.current.ontrack = (e) => {
                remoteStreamRef.current = e.streams[0];
                audioRef.current.srcObject = remoteStreamRef.current;
                audioRef.current.play().catch(() => {});
                setIsCallConnected(true);
                setStreamTick((p) => p + 1);
            };

            pcRef.current.onicecandidate = (e) => {
                if (e.candidate)
                    socket.emit("ice-candidate", {
                        to: from,
                        candidate: e.candidate,
                    });
            };

            await pcRef.current.setRemoteDescription(offer);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            socket.emit("answer-call", { to: from, answer, callType });
            setOnCallWith(from);
            setActiveCallUserInfo(incomingCall.callerInfo);
            setIncomingCall(null);
        } catch (err) {
            console.error(err);
            endCall();
        }
    };

    // ----------------------
    // END CALL
    // ----------------------
    const endCall = () => {
        ringingAudioRef.current?.pause();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
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
        <SocketContext.Provider
            value={{
                socket,
                onlineUsers,
                incomingCall,
                onCallWith,
                isCallConnected,
                callStartTime,
                activeCallUserInfo,
                isMuted,
                callType,
                startCall,
                acceptCall,
                endCall: notifyEndCall,
                toggleMute: () => setIsMuted((p) => !p),
                localStreamRef,
                remoteStreamRef,
                streamTick,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

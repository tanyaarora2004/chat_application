// frontend/src/components/messages/VoiceRecorder.js
import React, { useState, useRef } from "react";
import apiClient from "../../api/api"; // your axios instance with baseURL/auth
import useConversation from "../../zustand/useConversation";

const VoiceRecorder = ({ receiverId, onSent }) => {
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        await uploadAudio(blob, duration);

        // stop tracks
        streamRef.current.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      startRef.current = Date.now();
      setRecording(true);
    } catch (err) {
      console.error("Microphone error", err);
      alert("Could not access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const uploadAudio = async (blob, duration) => {
    try {
      setSending(true);
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", file);
      form.append("audioDuration", String(duration));

      // note: route: POST /api/messages/voice/:id
      const res = await apiClient.post(`/messages/voice/${receiverId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (onSent) onSent(res.data);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to send voice message");
    } finally {
      setSending(false);
      chunksRef.current = [];
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {!recording ? (
        <button onClick={startRecording} disabled={sending} title="Record voice">
          🎤
        </button>
      ) : (
        <button onClick={stopRecording} title="Stop recording">
          ⏹
        </button>
      )}

      {sending && <small>Sending...</small>}
    </div>
  );
};

export default VoiceRecorder;

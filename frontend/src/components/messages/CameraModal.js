import React, { useEffect, useRef, useState } from "react";
import "../../styles/Chat.css";

const CameraModal = ({ onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [capturedBlob, setCapturedBlob] = useState(null);

    // 🛑 STOP CAMERA CLEANLY
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        streamRef.current = null;
    };

    // START CAMERA ON LOAD
    useEffect(() => {
        // 🚀 START CAMERA
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                alert("Camera access blocked. Enable camera permission.");
                onClose();
            }
        };
        
        startCamera();

        return () => {
            stopCamera();
        };
    }, [onClose]);

    // 📸 CAPTURE IMAGE
    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            setCapturedBlob(blob);
            stopCamera(); // STOP CAMERA RIGHT AFTER CAPTURE
        }, "image/jpeg", 0.9);
    };

    // 🔄 RETAKE IMAGE
    const retake = async () => {
        setCapturedBlob(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera restart error:", err);
            alert("Failed to restart camera.");
            onClose();
        }
    };

    // ➤ SEND IMAGE
    const handleSend = () => {
        if (!capturedBlob) return;
        onCapture(capturedBlob);
        stopCamera();
        onClose();
    };

    // ✕ CLOSE MODAL
    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <div className="camera-modal-overlay">
            <div className="camera-modal">
                {/* Close Button */}
                <button className="camera-close" onClick={handleClose}>
                    ✕
                </button>

                {/* Preview */}
                {!capturedBlob ? (
                    <video ref={videoRef} autoPlay playsInline className="camera-video" />
                ) : (
                    <img
                        src={URL.createObjectURL(capturedBlob)}
                        alt="Captured"
                        className="camera-preview"
                    />
                )}

                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Controls */}
                <div className="camera-controls">
                    {!capturedBlob ? (
                        <button className="camera-btn capture" onClick={capturePhoto}>
                            📸
                        </button>
                    ) : (
                        <>
                            <button className="camera-btn retake" onClick={retake}>
                                🔄
                            </button>
                            <button className="camera-btn send" onClick={handleSend}>
                                ➤
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;

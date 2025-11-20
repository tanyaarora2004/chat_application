import React, { useEffect } from "react";
import "../../styles/Chat.css";

const ImageViewer = ({ imageUrl, isOpen, onClose }) => {
    // Close on ESC key
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        // Close when clicking anywhere except the image
        if (e.target === e.currentTarget || !e.target.closest('img')) {
            onClose();
        }
    };

    return (
        <div className="image-viewer-overlay" onClick={handleBackdropClick}>
            <div className="image-viewer-container">
                {/* Close button */}
                <button className="image-viewer-close" onClick={onClose}>
                    ✕
                </button>
                
                {/* Full screen image */}
                <img
                    src={imageUrl}
                    alt="Full size"
                    className="image-viewer-img"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                />
                
                {/* Download button */}
                <a
                    href={imageUrl}
                    download="image.jpg"
                    className="image-viewer-download"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking download
                >
                    📥 Download
                </a>
            </div>
        </div>
    );
};

export default ImageViewer;
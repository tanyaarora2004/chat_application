import React, { useEffect, useRef } from 'react';
import Message from './Message.js';
import useGetMessages from '../../hooks/useGetMessages.js';
import useListenMessages from '../../hooks/useListenMessages.js';
import '../../styles/Chat.css';
import { formatDateSeparator } from '../../utils/formatDate.js'; // --- CHANGE 1: Import the helper ---

const MessageSkeleton = () => {
    return (
        <div className="message-skeleton">
            <div className="skeleton-message skeleton-left"></div>
            <div className="skeleton-message skeleton-right"></div>
            <div className="skeleton-message skeleton-center"></div>
        </div>
    );
};

const Messages = () => {
    const { messages, loading } = useGetMessages();
    useListenMessages();
    const lastMessageRef = useRef();

    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    // --- CHANGE 2: Add a variable to track the last date ---
    let lastMessageDate = null;

    return (
        <div className="messages-container">
            {loading && <MessageSkeleton />}

            {!loading && messages.length > 0 &&
                // --- CHANGE 3: Update the mapping logic ---
                messages.map((message, index) => {
                    const messageDate = new Date(message.createdAt).toDateString();
                    const showDateSeparator = messageDate !== lastMessageDate;
                    lastMessageDate = messageDate;
                    const isLastMessage = index === messages.length - 1;

                    return (
                        <React.Fragment key={message._id}>
                            {showDateSeparator && (
                                <div className="date-separator">
                                    <span>{formatDateSeparator(message.createdAt)}</span>
                                </div>
                            )}
                            <div ref={isLastMessage ? lastMessageRef : null}>
                                <Message message={message} />
                            </div>
                        </React.Fragment>
                    );
                })
            }

            {!loading && messages.length === 0 && (
                <p className="no-messages">
                    Send a message to start the conversation!
                </p>
            )}
        </div>
    );
};

export default Messages;
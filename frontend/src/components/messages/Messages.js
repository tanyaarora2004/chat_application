// frontend/src/components/chat/Messages.js

import React, { useEffect, useRef } from 'react';
import Message from './Message.js';
import useGetMessages from '../../hooks/useGetMessages.js';
import useListenMessages from '../../hooks/useListenMessages.js';
import '../../styles/Chat.css';
import { formatDateSeparator } from '../../utils/formatDate.js';
import useConversation from '../../zustand/useConversation.js';
import apiClient from '../../api/api.js';

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
    const { loading } = useGetMessages();
    const { selectedConversation, messages } = useConversation();
    const lastMessageRef = useRef();

    // Listen to new real-time messages
    useListenMessages();

    // Auto scroll to last message
    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    // Mark messages as seen
    useEffect(() => {
        const markAsSeen = async () => {
            if (selectedConversation && messages.length > 0) {
                const hasUnread = messages.some(
                    (msg) =>
                        msg.senderId === selectedConversation._id &&
                        msg.status !== "seen"
                );

                if (hasUnread) {
                    try {
                        await apiClient.post(`/messages/seen/${selectedConversation._id}`);
                    } catch (error) {
                        console.error("❌ Failed to mark messages as seen:", error);
                    }
                }
            }
        };

        markAsSeen();
    }, [messages, selectedConversation]);

    let lastMessageDate = null;

    return (
        <div className="messages-container">
            {loading && <MessageSkeleton />}

            {!loading && messages.length > 0 &&
                messages.map((message, index) => {
                    const messageDate = new Date(message.createdAt).toDateString();
                    const showDateSeparator = messageDate !== lastMessageDate;
                    lastMessageDate = messageDate;

                    const isLastMessage = index === messages.length - 1;

                    return (
                        <React.Fragment key={message._id}>
                            {/* DATE SEPARATOR */}
                            {showDateSeparator && (
                                <div className="date-separator">
                                    <span>{formatDateSeparator(message.createdAt)}</span>
                                </div>
                            )}

                            {/* FILE-SHARING SUPPORT (just like second code) */}
                            <div ref={isLastMessage ? lastMessageRef : null}>
                                <Message message={message} /> 
                                {/* Message component already handles fileUrl, audio, etc. */}
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

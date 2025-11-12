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
    const { selectedConversation, messages } = useConversation(); // Direct subscription to store
    const lastMessageRef = useRef();

    // Listen to socket events for new messages or seen updates
    useListenMessages();

    // Auto scroll to the last message whenever messages update
    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    // --- MARK MESSAGES AS SEEN WHEN VIEWED ---
    useEffect(() => {
        const markAsSeen = async () => {
            if (selectedConversation && messages.length > 0) {
                // Check if there are any unread messages from the other user
                const hasUnread = messages.some(
                    (msg) =>
                        msg.senderId === selectedConversation._id &&
                        msg.status !== "seen"
                );

                console.log("📖 Checking for unread messages from:", selectedConversation._id, "hasUnread:", hasUnread);

                if (hasUnread) {
                    try {
                        console.log("📖 Making API call to mark messages as seen for:", selectedConversation._id);
                        // Mark all unseen messages in this chat as seen
                        await apiClient.post(`/messages/seen/${selectedConversation._id}`);
                        console.log("📖 Successfully marked messages as seen");
                        // Socket event will update other user's UI via useListenMessages
                    } catch (error) {
                        console.error("❌ Failed to mark messages as seen:", error);
                    }
                }
            }
        };

        markAsSeen();
    }, [messages, selectedConversation]);
    // --- END MARK SEEN ---

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

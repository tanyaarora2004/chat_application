// components/messages/ReadReceipt.js
import React from 'react';

// Single Tick Icon (Sent)
const SingleTick = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
    </svg>
);

// Double Tick Icon (Delivered or Seen)
const DoubleTick = ({ color = "currentColor" }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
        <path d="M15 6L4 17"></path>
    </svg>
);

const ReadReceipt = ({ status }) => {
    if (status === 'seen') return <DoubleTick color="#44c2fcff" />;
    if (status === 'delivered') return <DoubleTick color="gray" />;
    return <SingleTick color="gray" />;
};

export default ReadReceipt;

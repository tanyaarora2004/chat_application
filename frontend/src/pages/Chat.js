import React from 'react';
import Sidebar from '../components/sidebar/Sidebar.js';
import MessageContainer from '../components/messages/MessageContainer.js';
import Navbar from '../components/layout/Navbar.js';
import '../styles/Chat.css';

const Chat = () => {
    return (
        <div className="chat-app">
            <div className="glass-effect shadow-medium" style={{
                width: '95vw',
                maxWidth: '1400px',
                height: '95vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                overflow: 'hidden',
                margin: 'auto'
            }}>
                <Navbar />
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <Sidebar />
                    <MessageContainer />
                </div>
            </div>
        </div>
    );
};

export default Chat;

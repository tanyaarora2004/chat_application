//  Load dotenv first - THIS IS THE FIX
import dotenv from 'dotenv';
dotenv.config(); // This line MUST be first

//  Core imports
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';

//  Import the configured app and server from your socket file
import { app, server } from './socket/socket.js';

//  Import database and route configurations
import connectToDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Passport configuration AFTER dotenv
import './config/passport.js';

const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// --- Test Route ---
app.get('/', (req, res) => res.send('Server with Socket.IO is running'));

// --- Start Server ---
server.listen(PORT, () => {
    connectToDB();
    console.log(`🚀 Server running on port ${PORT}`);
});


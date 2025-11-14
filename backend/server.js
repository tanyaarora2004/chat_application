// ------------------------------
// 1️⃣ Load dotenv FIRST
// ------------------------------
import dotenv from 'dotenv';
dotenv.config(); // MUST be first before anything else

// ------------------------------
// 2️⃣ Core imports
// ------------------------------
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';

// ------------------------------
// 3️⃣ Import the app + server from socket.js
// ------------------------------
import { app, server } from './socket/socket.js';

// ------------------------------
// 4️⃣ DB + Routes
// ------------------------------
import connectToDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Load passport configuration
import './config/passport.js';

// ------------------------------
// 5️⃣ Fix __dirname for ES modules
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// 6️⃣ Port
// ------------------------------
const PORT = process.env.PORT || 5000;

// ------------------------------
// 7️⃣ CORS (Important for audio uploads + sockets)
// ------------------------------
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ------------------------------
// 8️⃣ Middlewares
// ------------------------------
app.use(express.json({ limit: '50mb' }));     // Audio needs higher limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));  
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

// ------------------------------
// 9️⃣ Static folder for audio
// ------------------------------
// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads/audio directory');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------------------
// 🔟 API Routes
// ------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// ------------------------------
// 1️⃣1️⃣ Test route
// ------------------------------
app.get('/', (req, res) => {
    res.send('Server + Socket.IO running successfully');
});

// ------------------------------
// 1️⃣2️⃣ Start server
// ------------------------------
server.listen(PORT, () => {
    connectToDB();
    console.log(`🚀 Server running on port ${PORT}`);
});

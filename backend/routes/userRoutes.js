import express from 'express';
import protectRoute from '../middleware/authMiddleware.js';
// 1. Import the new searchUsers function from your controller
import { getUsersForSidebar, searchUsers } from '../controllers/userController.js';
import User from '../models/User.js';

const router = express.Router();

// Protected route for getting users for sidebar (existing)
router.get('/', protectRoute, getUsersForSidebar);

// 2. ADD THIS NEW ROUTE for handling search requests
router.get('/search', protectRoute, searchUsers);

// Test route to check if users exist (existing)
router.get('/test', async (req, res) => {
    try {
        const users = await User.find({}).select('fullName username email');
        res.status(200).json({
            message: 'Users found',
            count: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

export default router;
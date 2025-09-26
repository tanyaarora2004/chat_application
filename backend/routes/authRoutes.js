import express from 'express';
import passport from 'passport';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import { signup, login, logout } from '../controllers/authController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

// Regular auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Check authentication status
router.get('/me', protectRoute, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    username: req.user.username,
  });
});

// Google OAuth - handles both signup and signin
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      generateTokenAndSetCookie(req.user._id, res);
      
      // Redirect to frontend with success
      res.redirect(`${process.env.CLIENT_URL}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

export default router;

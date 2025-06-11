import express from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getFollowers,
  getFollowing,
  follow,
  unfollow,
} from '../Controller/profile.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';
import upload from '../Middleware/multer.js';

const router = express.Router();

// Search users by name or bio
router.get('/search', searchUsers);

// Update logged-in user's profile (with optional avatar upload)
router.put('/profile', authenticateToken, upload.single('avatar'), updateProfile);

// Get user profile by user ID
router.get('/id/:id', getUserProfile);

// Get followers of a user by user ID
router.get('/id/:id/followers', getFollowers);

// Get users followed by a user by user ID
router.get('/id/:id/following', getFollowing);

// Follow or unfollow a user by user ID
router.post('/id/:id/follow', authenticateToken, follow);
router.post('/id/:id/unfollow', authenticateToken, unfollow);

export default router;
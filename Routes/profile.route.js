import express from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getFollowers,
  getFollowing,
  toggleFollow,
} from '../Controller/profile.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';
import upload from '../Middleware/multer.js';

const router = express.Router();

// IMPORTANT: Put specific routes BEFORE parameterized routes
// Search users by name or bio (moved to top)
router.get('/search', searchUsers);

// Update logged-in user's profile (with optional avatar upload)
router.put('/profile', authenticateToken, upload.single('avatar'), updateProfile);

// Get user profile by username
router.get('/:username', getUserProfile);

// Get followers of a user
router.get('/:username/followers', getFollowers);

// Get users followed by a user
router.get('/:username/following', getFollowing);

// Follow or unfollow a user by username
router.post('/:username/follow', authenticateToken, toggleFollow);

export default router;
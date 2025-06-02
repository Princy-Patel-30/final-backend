import express from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getFollowers,
  getFollowing,
  toggleFollow,
} from '../Controller/profiler.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';
import upload from '../Middleware/multer.js';

const router = express.Router();

// Get profile by username
router.get('/:username', getUserProfile);

// Update logged-in user's profile
router.put(
  '/profile',
  authenticateToken,
  upload.single('avatar'),
  updateProfile
);

// Search users by name or username
router.get('/search', searchUsers);

// Get followers of a user
router.get('/:username/followers', getFollowers);

// Get following list of a user
router.get('/:username/following', getFollowing);

// Follow or unfollow a user
router.post('/:userId/follow', authenticateToken, toggleFollow);

export default router;

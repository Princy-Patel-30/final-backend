import * as profileService from '../services/profileService.js';

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id; 
    const user = await profileService.getProfileById(id, currentUserId);
    res.json({ data: user, message: 'Profile fetched successfully' });
  } catch (err) {
    res.status(err.message === 'User not found' ? 404 : 500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const currentUserId = req.user?.id; // Get current user ID

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }

    const searchResult = await profileService.searchUsers(q, pageNum, limitNum, currentUserId);
    res.json({ data: searchResult, message: 'Users fetched successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, bio, avatarUrl } = req.body;
    const fileBuffer = req.file?.buffer;

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Username cannot be empty' });
      }
      if (name.length < 3 || name.length > 30) {
        return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      }
    }

    const updatedUser = await profileService.updateUserProfile(id, {
      name: name?.trim(),
      bio,
      avatarUrl,
      fileBuffer,
    });

    res.json({
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    // Replace with logging library in production
    // logger.error('Update profile error:', err);
    if (err.message === 'Username already exists') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (err.code === 'P2002' && err.meta?.target?.includes('name')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (err.message === 'Invalid avatar URL format' || err.message === 'Avatar URL must be from Cloudinary') {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: 'Failed to update profile' });
  }
};



export const follow = async (req, res) => {
  try {
    const { id: followerId } = req.user;
    const { id: followingId } = req.params;

    const result = await profileService.followUser(followerId, followingId);
    res.json({ data: result, message: 'Followed user successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const unfollow = async (req, res) => {
  try {
    const { id: followerId } = req.user;
    const { id: followingId } = req.params;

    const result = await profileService.unfollowUser(followerId, followingId);
    res.json({ data: result, message: 'Unfollowed user successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }

    const result = await profileService.getFollowers(id, pageNum, limitNum);
    res.json({ data: result, message: 'Followers fetched successfully' });
  } catch (err) {

    res.status(err.message === 'User not found' ? 404 : 400).json({ error: err.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }

    const result = await profileService.getFollowing(id, pageNum, limitNum);
    res.json({ data: result, message: 'Following fetched successfully' });
  } catch (err) {
    res.status(err.message === 'User not found' ? 404 : 400).json({ error: err.message });
  }
};
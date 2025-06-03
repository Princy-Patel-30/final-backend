import * as profileService from '../services/profileService.js';

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await profileService.getProfileByUsername(username);
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(err.message === 'User not found' ? 404 : 500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, bio } = req.body;
    const fileBuffer = req.file?.buffer;

    const updatedUser = await profileService.updateUserProfile(id, { name, bio, fileBuffer });
    res.json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({ error: 'Failed to update profile' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    console.log('Search params:', { q, page, limit }); // Debug log
    
    const searchResult = await profileService.searchUsers(q, parseInt(page), parseInt(limit));
    console.log('Search results:', searchResult.usersfound, 'users found'); // Debug log
    
    res.json(searchResult);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const follow = async (req, res) => {
  try {
    const { id } = req.user;
    const { username } = req.params;

    const result = await profileService.followUserByUsername(id, username);
    res.json(result);
  } catch (err) {
    console.error('Follow error:', err);
    res.status(400).json({ error: err.message });
  }
};

export const unfollow = async (req, res) => {
  try {
    const { id } = req.user;
    const { username } = req.params;

    const result = await profileService.unfollowUserByUsername(id, username);
    res.json(result);
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(400).json({ error: err.message });
  }
};


export const getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    console.log('Get followers:', { username, page, limit }); // Debug log
    
    const result = await profileService.getFollowers(username, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(err.message === 'User not found' ? 404 : 500).json({ error: err.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    console.log('Get following:', { username, page, limit }); // Debug log
    
    const result = await profileService.getFollowing(username, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (err) {
    console.error('Get following error:', err);
    res.status(err.message === 'User not found' ? 404 : 500).json({ error: err.message });
  }
};
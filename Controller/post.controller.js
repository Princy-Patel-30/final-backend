import * as postService from '../services/postService.js';

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const files = req.files || [];

    const newPost = await postService.createPost(userId, content, files);
    res.status(201).json({ message: 'Post created successfully.', post: newPost });
  } catch (error) {
    console.error('[Create Post Error]', error.message);
    res.status(400).json({ error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const posts = await postService.getUserPosts(userId, page);
    res.json({
      posts,
      hasMore: posts.length === 10, 
    });
  } catch (err) {
    console.error('Get user posts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
};
export const getHomeFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const posts = await postService.getHomeFeed(userId, page);
    res.json({
      posts,
      hasMore: posts.length === 10, // Assume limit=10
    });
  } catch (err) {
    console.error('Feed error:', err.message);
    res.status(500).json({ error: 'Unable to fetch feed' });
  }
};

export const getPostDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    const post = await postService.getPostDetails(postId, userId);
    res.json(post);
  } catch (err) {
    console.error('Post detail error:', err.message);
    res.status(404).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const newComment = await postService.addComment(postId, userId, content);
    res.status(201).json({ message: 'Comment added successfully.', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(400).json({ error: error.message });
  }
};

export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const updatedComment = await postService.editComment(commentId, userId, content);
    res.status(200).json({ message: 'Comment updated successfully.', comment: updatedComment });
  } catch (err) {
    console.error('Edit comment error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    await postService.deleteComment(commentId, userId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { likesCount, likedUsers } = await postService.likePost(userId, postId);
    res.status(201).json({
      message: 'Post liked',
      likesCount,
      likedUsers,
    });
  } catch (err) {
    console.error('Like error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const likesCount = await postService.unlikePost(userId, postId);
    res.json({ message: 'Post unliked', likesCount });
  } catch (err) {
    console.error('Unlike error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await postService.getPostComments(postId);
    res.json(comments);
  } catch (err) {
    console.error('Comments error:', err.message);
    res.status(500).json({ error: 'Unable to fetch comments' });
  }
};

export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const save = await postService.savePost(userId, postId);
    res.status(201).json({ message: 'Post saved', save });
  } catch (err) {
    console.error('Save post error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const posts = await postService.getSavedPosts(userId, page);
    res.json({
      posts,
      hasMore: posts.length === 10, 
    });
  } catch (err) {
    console.error('Get saved posts error:', err.message);
    res.status(500).json({ error: 'Failed to load saved posts' });
  }
};

import express from 'express';
import * as postController from '../Controller/post.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';
import upload from '../Middleware/multer.js';

const router = express.Router();

router.get('/feed', authenticateToken, postController.getHomeFeed);
router.post('/', authenticateToken, upload.array('media', 4), postController.createPost);
router.get('/user/:userId', authenticateToken, postController.getUserPosts);
router.get('/saved', authenticateToken, postController.getSavedPosts);
router.get('/:postId', authenticateToken, postController.getPostDetails);
router.post('/:postId/comments', authenticateToken, postController.addComment);
router.put('/comments/:commentId', authenticateToken, postController.editComment);
router.delete('/comments/:commentId', authenticateToken, postController.deleteComment);
router.post('/like/:postId', authenticateToken, postController.likePost);
router.delete('/unlike/:postId', authenticateToken, postController.unlikePost);
router.get('/:postId/comments', authenticateToken, postController.getPostComments);
router.post('/save/:postId', authenticateToken, postController.savePost);

export default router;
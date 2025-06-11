import express from 'express';
import * as chatController from '../Controller/chat.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', chatController.listChats);
router.post('/', chatController.createOrFindChat);
router.get('/search/:query', chatController.searchUsers);
router.get('/:chatId', chatController.getChatDetails);
router.get('/:chatId/messages', chatController.listMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.delete('/:chatId', chatController.deleteChat);

export default router;
import express from 'express';
import {
  register,
  activateAccount,
  login,
  forgotPassword,
  resetPassword,
  logout,
  refreshAccessToken
} from '../Controller/auth.controller.js';
import { authenticateToken } from '../Middleware/auth.middleware.js';

const router = express.Router();

router.post('/register',  register);
router.get('/activate/:token', activateAccount);
router.post('/login',login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout',authenticateToken ,logout);
router.post('/refresh-token',authenticateToken, refreshAccessToken);
export default router;

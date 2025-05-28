import express from 'express';
import {
  register,
  activateAccount,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from '../Controller/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.get('/activate/:token', activateAccount);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', logout);

export default router;

import bcrypt from 'bcryptjs';
import { sendActivationEmail, sendPasswordResetEmail } from '../Utils/mailer.js';
import { generateToken, verifyToken } from '../Utils/jwt.js';
import prisma from '../Config/db.js';
import env from '../Config/env.js';
import { isValidEmail, isValidUsername, isStrongPassword } from '../Helper/Regex.js';

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!isValidUsername(name)) {
      return res.status(400).json({ error: 'Username must be alphanumeric only' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isActive: false,
      },
    });

    const token = generateToken({ id: user.id }, 'activation');
    const activationLink = `${env.CLIENT_URL}/activate/${token}`;

    await sendActivationEmail(email, activationLink);

    res.status(201).json({
      message: 'Registration successful. Please check your email to activate your account.',
    });
  } catch (_err) {
    res.status(500).json({ error: `Registration failed: ${_err.message}` });
  }
};

// Activate Account
export const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const { id } = verifyToken(token, 'activation');
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isActive) {
      return res.status(400).json({ error: 'Account already activated' });
    }
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
    res.status(200).json({ message: 'Account activated successfully' });
  } catch (_err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account not activated. Please check your email.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const accessToken = generateToken({ id: user.id }, 'access');
    const refreshToken = generateToken({ id: user.id }, 'refresh');

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (_err) {
    res.status(500).json({ error: `Login failed: ${_err.message}` });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = generateToken({ id: user.id }, 'reset');
    const resetLink = `${env.CLIENT_URL}/reset-password/${token}`;

    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (_err) {
    res.status(500).json({ error: `Failed to send reset link: ${_err.message}` });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Both password fields are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const { id } = verifyToken(token, 'reset');
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (_err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logout successful' });
  } catch (_err) {
    res.status(500).json({ error: `Logout failed: ${_err.message}` });
  }
};

import {
  registerUser,
  activateUser,
  loginUser,
  sendResetPassword,
  resetUserPassword,
  logoutUser,
  refreshAccessTokenService,
} from '../services/authService.js';
import { setAuthCookies } from '../Utils/jwt.js';
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
    await registerUser({ name, email, password });
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
    await activateUser(token);
    res.status(200).json({ message: 'Account activated successfully' });
  } catch (_err) {
    res.status(400).json({ error: _err.message || 'Invalid or expired token' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Username or email and password are required' });
    }
    const { user, accessToken, refreshToken } = await loginUser({ loginId, password });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (_err) {
    res.status(401).json({ error: _err.message || 'Login failed' });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    await sendResetPassword(email);
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
    await resetUserPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (_err) {
    res.status(400).json({ error: _err.message || 'Invalid or expired token' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    await logoutUser(refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logout successful' });
  } catch (_err) {
    res.status(500).json({ error: `Logout failed: ${_err.message}` });
  }
};

// Refresh Access Token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }
    const newAccessToken = await refreshAccessTokenService(refreshToken);
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15,
    });
    res.status(200).json({ accessToken: newAccessToken, message: 'Access token refreshed successfully' });
  } catch (_err) {
    res.status(401).json({ error: _err.message || 'Invalid or expired refresh token' });
  }
};

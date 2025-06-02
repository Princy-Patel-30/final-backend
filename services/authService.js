import bcrypt from 'bcryptjs';
import prisma from '../Config/db.js';
import env from '../Config/env.js';
import { sendActivationEmail, sendPasswordResetEmail } from '../Utils/mailer.js';
import {
  generateToken,
  setAuthCookies,
  storeRefreshToken,
  storeActivationToken,
  storeResetToken,
  verifyToken,
  getTokenExpiration,
} from '../Utils/jwt.js';

export async function registerUser({ name, email, password }) {
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
  const expiresAt = getTokenExpiration('activation');
  await storeActivationToken(user.id, token, expiresAt);
  const activationLink = `${env.CLIENT_URL}/activate/${token}`;
  await sendActivationEmail(email, activationLink);
  return user;
}

export async function activateUser(token) {
  const { id } = verifyToken(token, 'activation');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  if (user.isActive) throw new Error('Account already activated');
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  return true;
}

export async function loginUser({ loginId, password }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: loginId }, { name: loginId }],
    },
  });
  if (!user) throw new Error('Invalid username or email');
  if (!user.isActive) throw new Error('Account not activated. Please check your email.');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid password');
  const accessToken = generateToken({ id: user.id }, 'access');
  const refreshToken = generateToken({ id: user.id }, 'refresh');
  const expiresAt = getTokenExpiration('refresh');
  await storeRefreshToken(user.id, refreshToken, expiresAt);
  return { user, accessToken, refreshToken };
}

export async function sendResetPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  const token = generateToken({ id: user.id }, 'reset');
  const expiresAt = getTokenExpiration('reset');
  await storeResetToken(user.id, token, expiresAt);
  const resetLink = `${env.CLIENT_URL}/reset-password/${token}`;
  await sendPasswordResetEmail(email, resetLink);
}

export async function resetUserPassword(token, newPassword) {
  const { id } = verifyToken(token, 'reset');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
}

export async function logoutUser(refreshToken) {
  if (refreshToken) {
    await prisma.token.deleteMany({ where: { refreshToken } });
  }
}

export async function refreshAccessTokenService(refreshToken) {
  const { id } = verifyToken(refreshToken, 'refresh');
  const storedToken = await prisma.token.findFirst({
    where: {
      refreshToken,
      userId: id,
      expiresAt: { gte: new Date() },
    },
  });
  if (!storedToken) throw new Error('Invalid or expired refresh token');
  const newAccessToken = generateToken({ id }, 'access');
  return newAccessToken;
}

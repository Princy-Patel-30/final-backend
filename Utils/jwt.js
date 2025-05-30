import jwt from 'jsonwebtoken';
import env from '../Config/env.js';
import prisma from '../Config/db.js';

export const generateToken = (payload, type = 'access') => {
  const secrets = {
    access: env.JWT_ACCESS_SECRET,
    refresh: env.JWT_REFRESH_SECRET,
    activation: env.JWT_ACTIVATION_SECRET,
    reset: env.JWT_RESET_SECRET,
  };

  const expiries = {
    access: env.JWT_ACCESS_EXPIRY,
    refresh: env.JWT_REFRESH_EXPIRY,
    activation: env.JWT_ACTIVATION_EXPIRY,
    reset: env.JWT_RESET_EXPIRY,
  };

  if (!secrets[type] || !expiries[type]) {
    throw new Error(`Invalid token type: ${type}`);
  }

  return jwt.sign(payload, secrets[type], { expiresIn: expiries[type] });
};

export const verifyToken = (token, type = 'access') => {
  const secrets = {
    access: env.JWT_ACCESS_SECRET,
    refresh: env.JWT_REFRESH_SECRET,
    activation: env.JWT_ACTIVATION_SECRET,
    reset: env.JWT_RESET_SECRET,
  };

  if (!secrets[type]) {
    throw new Error(`Invalid token type: ${type}`);
  }

  return jwt.verify(token, secrets[type]);
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 15, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};
export const storeRefreshToken = async (userId, refreshToken, expiresAt) => {
  try {
    await prisma.token.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
};

export const storeActivationToken = async (userId, token, expiresAt) => {
  try {
    await prisma.activationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  } catch (error) {
    throw new Error(`Failed to store activation token: ${error.message}`);
  }
};
export const storeResetToken = async (userId, token, expiresAt) => {
  try {
    await prisma.resetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  } catch (error) {
    throw new Error(`Failed to store reset token: ${error.message}`);
  }
};

export const getTokenExpiration = (type) => {
  const expiries = {
    access: env.JWT_ACCESS_EXPIRY,
    refresh: env.JWT_REFRESH_EXPIRY,
    activation: env.JWT_ACTIVATION_EXPIRY,
    reset: env.JWT_RESET_EXPIRY,
  };

  if (!expiries[type]) {
    throw new Error(`Invalid token type: ${type}`);
  }

  // Parse expiry (e.g., '15m', '7d', '1h') to milliseconds
  const expiry = expiries[type];
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  let milliseconds;

  switch (unit) {
    case 's':
      milliseconds = value * 1000;
      break;
    case 'm':
      milliseconds = value * 1000 * 60;
      break;
    case 'h':
      milliseconds = value * 1000 * 60 * 60;
      break;
    case 'd':
      milliseconds = value * 1000 * 60 * 60 * 24;
      break;
    default:
      throw new Error(`Invalid expiry format for ${type}: ${expiry}`);
  }

  return new Date(Date.now() + milliseconds);
};



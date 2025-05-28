import jwt from 'jsonwebtoken';
import env from '../Config/env.js';

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

  return jwt.sign(payload, secrets[type], { expiresIn: expiries[type] });
};

export const verifyToken = (token, type = 'access') => {
  const secrets = {
    access: env.JWT_ACCESS_SECRET,
    refresh: env.JWT_REFRESH_SECRET,
    activation: env.JWT_ACTIVATION_SECRET,
    reset: env.JWT_RESET_SECRET,
  };

  return jwt.verify(token, secrets[type]);
};

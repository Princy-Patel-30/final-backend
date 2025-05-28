import dotenv from 'dotenv';
dotenv.config();

const required = [
  'PORT',
  'DATABASE_URL',

  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRY',
  'JWT_ACTIVATION_SECRET',
  'JWT_ACTIVATION_EXPIRY',
  'JWT_RESET_SECRET',
  'JWT_RESET_EXPIRY',

  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',

  'CLIENT_URL',
  'BASE_URL',
  'CORS_ORIGIN',
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

export default {
  PORT: parseInt(process.env.PORT, 10),
  DATABASE_URL: process.env.DATABASE_URL,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
  JWT_ACTIVATION_SECRET: process.env.JWT_ACTIVATION_SECRET,
  JWT_ACTIVATION_EXPIRY: process.env.JWT_ACTIVATION_EXPIRY,
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
  JWT_RESET_EXPIRY: process.env.JWT_RESET_EXPIRY,

  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  CLIENT_URL: process.env.CLIENT_URL,
  BASE_URL: process.env.BASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};

import nodemailer from 'nodemailer';
import env from '../Config/env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('Email transporter error:', error.message);
     console.error('Check your network connection, SMTP credentials, and firewall settings.');
  } else {
    console.log('Email transporter is ready');
  }
});

export default transporter;

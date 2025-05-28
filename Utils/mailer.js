import nodemailer from 'nodemailer';
import env from '../Config/env.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT) || 587,
  secure: env.EMAIL_PORT === '465',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Verify transporter
transporter.verify((error, _success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// Common email HTML template generator
const generateEmailTemplate = (title, message, buttonText, buttonLink) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
  </head>
  <body style="margin:0; font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h2 style="color: #333;">${title}</h2>
          <p style="color: #555; font-size: 16px;">${message}</p>
          <a href="${buttonLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
            ${buttonText}
          </a>
          <p style="margin-top: 30px; color: #999; font-size: 13px;">If the button doesn't work, copy and paste this URL in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${buttonLink}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; background-color: #f8f9fa; font-size: 12px; color: #999;">
          © ${new Date().getFullYear()} SocioFeed. All rights reserved.
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

// Send activation email
export const sendActivationEmail = async (toEmail, activationLink) => {
  const htmlContent = generateEmailTemplate(
    'Activate Your SocioFeed Account',
    'Thanks for signing up! Click the button below to activate your account.',
    'Activate Account',
    activationLink
  );

  try {
    await transporter.sendMail({
      from: `"SocioFeed" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'Activate Your SocioFeed Account',
      html: htmlContent,
    });
    return { success: true, message: 'Activation email sent successfully' };
  } catch (error) {
    throw new Error(`Failed to send activation email: ${error.message}`);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const htmlContent = generateEmailTemplate(
    'Reset Your SocioFeed Password',
    'Forgot your password? No worries — click below to reset it.',
    'Reset Password',
    resetLink
  );

  try {
    await transporter.sendMail({
      from: `"SocioFeed" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'SocioFeed Password Reset',
      html: htmlContent,
    });
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export default transporter;

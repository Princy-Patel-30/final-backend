import transporter from './transporter.js';
import env from '../Config/env.js';
import { generateEmailTemplate, stripHtmlTags } from './mailTemplates.js';

// Send activation email
export const sendActivationEmail = async (toEmail, activationLink) => {
  const html = generateEmailTemplate(
    'Verify your Sociofeed account',
    'Thank you for registering on SocioFeed. Please verify your email by clicking the button below:',
    'Activate Account',
    activationLink
  );

  try {
    await transporter.sendMail({
      from: {
        name: 'SocioFeed',
        address: env.EMAIL_FROM,
      },
      to: toEmail,
      subject: 'Verify your email to activate your SocioFeed account',
      html,
      text: stripHtmlTags(html),
      replyTo: env.EMAIL_REPLY_TO || env.EMAIL_FROM,
      headers: {
        'X-Mailer': 'SocioFeed App Mailer',
      },
    });
    return { success: true, message: 'Activation email sent successfully.' };
  } catch (error) {
    console.error('Failed to send activation email:', error);
    throw new Error('Failed to send activation email.');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const html = generateEmailTemplate(
    'SocioFeed-Reset Password',
    'Forgot your password? Dont worry!  Click below to reset it.',
    'Reset Password',
    resetLink
  );

  try {
    await transporter.sendMail({
      from: {
        name: 'SocioFeed',
        address: env.EMAIL_FROM,
      },
      to: toEmail,
      subject: 'SocioFeed Password-reset',
      html,
      text: stripHtmlTags(html),
      replyTo: env.EMAIL_REPLY_TO || env.EMAIL_FROM,
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@sociofeed.com>',
      },
    });
    return { success: true, message: 'Password reset email sent successfully.' };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email.');
  }
};

import { resend, EMAIL_FROM, APP_URL, isEmailEnabled } from './resend-client';
import { logger } from '@/lib/utils/logger';

/**
 * Base email template wrapper
 */
function emailTemplate(title: string, content: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Ruby Routines</h1>
          </div>
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">${title}</h2>
          ${content}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
            This email was sent by Ruby Routines. If you did not request this, please ignore it.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generic email sending function
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!isEmailEnabled()) {
    logger.warn('Email service is not configured. Email not sent.', { to, subject });
    return false;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    });

    logger.info('Email sent successfully', { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', error as Error, { to, subject });
    return false;
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<boolean> {
  const subject = 'Ruby Routines - Verify Your Email';
  const content = `
    <p>Please use the following verification code to verify your email address:</p>
    <div style="background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
    </div>
    <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
    <p>If you didn't request this verification, you can safely ignore this email.</p>
  `;

  return sendEmail(to, subject, emailTemplate('Verify Your Email', content));
}

/**
 * Send password reset email
 * Note: For Supabase-based password reset, this is typically handled by Supabase.
 * This function is for custom password reset flows if needed.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  const subject = 'Ruby Routines - Reset Your Password';
  const content = `
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280;">This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
    </p>
  `;

  return sendEmail(to, subject, emailTemplate('Reset Your Password', content));
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
  const subject = 'Welcome to Ruby Routines!';
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to Ruby Routines! We're excited to have you on board.</p>
    <p>Ruby Routines helps you create and manage daily routines for yourself, your family, or your classroom. Here are a few things you can do:</p>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Create custom routines with tasks</li>
      <li style="margin-bottom: 8px;">Track progress with different task types</li>
      <li style="margin-bottom: 8px;">Set up kiosk mode for easy access</li>
      <li style="margin-bottom: 8px;">Share routines with others</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/parent" style="background-color: #7c3aed; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Get Started
      </a>
    </div>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br/>The Ruby Routines Team</p>
  `;

  return sendEmail(to, subject, emailTemplate('Welcome!', content));
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  if (!isEmailEnabled()) {
    logger.warn('Email service is not configured. Cannot send test email.');
    return false;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: to,
      subject: 'Ruby Routines - Email Configuration Test',
      html: emailTemplate(
        'Email Configuration Test',
        `
          <p>This is a test email from Ruby Routines.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <p style="font-size: 12px; color: #666;">
            Sent at ${new Date().toISOString()}
          </p>
        `
      ),
    });

    logger.info('Test email sent successfully', { to });
    return true;
  } catch (error) {
    logger.error('Failed to send test email', error as Error, { to });
    return false;
  }
}

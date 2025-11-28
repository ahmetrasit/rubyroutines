import { resend, EMAIL_FROM, APP_URL, isEmailEnabled } from './resend-client';
import { logger } from '@/lib/utils/logger';

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
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">Email Configuration Test</h1>
              <p>This is a test email from Ruby Routines.</p>
              <p>If you're receiving this, your email configuration is working correctly!</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">
                Sent from Ruby Routines at ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    logger.info('Test email sent successfully', { to });
    return true;
  } catch (error) {
    logger.error('Failed to send test email', error as Error, { to });
    return false;
  }
}

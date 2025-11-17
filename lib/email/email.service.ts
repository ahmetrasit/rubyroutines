import { resend, EMAIL_FROM, APP_URL, isEmailEnabled } from './resend-client';
import { logger } from '@/lib/utils/logger';
import { renderPersonSharingInviteEmail } from './templates/person-sharing-invite';

interface SendPersonSharingInviteParams {
  to: string;
  inviterName: string;
  personName?: string;
  shareType: 'PERSON' | 'ROUTINE_ACCESS' | 'FULL_ROLE';
  permissions: 'VIEW' | 'EDIT' | 'MANAGE';
  inviteCode: string;
  expiresAt: Date;
}

/**
 * Send a person sharing invitation email
 */
export async function sendPersonSharingInvite(params: SendPersonSharingInviteParams): Promise<boolean> {
  if (!isEmailEnabled()) {
    logger.warn('Email service is not configured. Skipping email send.');
    return false;
  }

  try {
    const emailHtml = renderPersonSharingInviteEmail({
      inviterName: params.inviterName,
      personName: params.personName,
      shareType: params.shareType,
      permissions: params.permissions,
      inviteCode: params.inviteCode,
      appUrl: APP_URL,
      expiresAt: params.expiresAt,
    });

    const subject = getEmailSubject(params.shareType, params.inviterName, params.personName);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: subject,
      html: emailHtml,
    });

    logger.info('Person sharing invitation email sent', {
      to: params.to,
      shareType: params.shareType,
      inviteCode: params.inviteCode,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send person sharing invitation email', error as Error, {
      to: params.to,
      shareType: params.shareType,
    });
    return false;
  }
}

/**
 * Generate email subject based on share type
 */
function getEmailSubject(
  shareType: 'PERSON' | 'ROUTINE_ACCESS' | 'FULL_ROLE',
  inviterName: string,
  personName?: string
): string {
  switch (shareType) {
    case 'PERSON':
      return personName
        ? `${inviterName} invited you to collaborate on ${personName}'s routines`
        : `${inviterName} invited you to collaborate on Ruby Routines`;
    case 'ROUTINE_ACCESS':
      return `${inviterName} shared routine access with you on Ruby Routines`;
    case 'FULL_ROLE':
      return `${inviterName} invited you to co-parent/co-teach on Ruby Routines`;
    default:
      return `${inviterName} invited you to Ruby Routines`;
  }
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

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Ruby Routines <noreply@rubyroutines.com>',
      to: email,
      subject: 'Verify your email address',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #9333ea; font-size: 28px; font-weight: 700;">Ruby Routines</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Verify your email address</h2>

              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                Hi ${name},
              </p>

              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                Thank you for signing up for Ruby Routines! To complete your registration, please verify your email address.
              </p>

              <p style="margin: 0 0 10px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                Your verification code is:
              </p>

              <!-- Verification Code -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #9333ea; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                Or click the button below to verify your email automatically:
              </p>

              <!-- Verify Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?userId=${userId || ''}&email=${encodeURIComponent(email)}&code=${code}"
                   style="display: inline-block; padding: 14px 32px; background-color: #9333ea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Verify Email
                </a>
              </div>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                This code will expire in 15 minutes. If you didn't create an account with Ruby Routines, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px; text-align: center;">
                © ${new Date().getFullYear()} Ruby Routines. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `Hi ${name},

Thank you for signing up for Ruby Routines! To complete your registration, please verify your email address.

Your verification code is: ${code}

Or visit this link to verify your email: ${process.env.NEXT_PUBLIC_APP_URL}/verify?userId=${userId || ''}&email=${encodeURIComponent(email)}&code=${code}

This code will expire in 15 minutes. If you didn't create an account with Ruby Routines, you can safely ignore this email.

© ${new Date().getFullYear()} Ruby Routines. All rights reserved.`,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

if (!process.env.RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@rubyroutines.com';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Check if email service is configured and available
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Two-Factor Authentication Service
 * Provides TOTP (Time-based One-Time Password) functionality
 *
 * IMPORTANT: Requires packages to be installed:
 * npm install speakeasy qrcode @types/speakeasy @types/qrcode
 */

import crypto from 'crypto';

// Types for speakeasy (will be available after package installation)
interface GeneratedSecret {
  ascii: string;
  hex: string;
  base32: string;
  otpauth_url?: string;
}

interface VerifyOptions {
  secret: string;
  encoding: 'base32' | 'hex' | 'ascii';
  token: string;
  window?: number;
}

/**
 * Generate a new 2FA secret for a user
 */
export async function generateTwoFactorSecret(
  userEmail: string,
  appName: string = 'Ruby Routines'
): Promise<{ secret: string; otpauthUrl: string }> {
  // Dynamic import to handle missing package gracefully
  try {
    const speakeasy = require('speakeasy');

    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    }) as GeneratedSecret;

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url!,
    };
  } catch (error) {
    throw new Error(
      'speakeasy package is not installed. Run: npm install speakeasy @types/speakeasy'
    );
  }
}

/**
 * Generate QR code data URL for 2FA setup
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const QRCode = require('qrcode');
    const dataUrl = await QRCode.toDataURL(otpauthUrl);
    return dataUrl;
  } catch (error) {
    throw new Error('qrcode package is not installed. Run: npm install qrcode @types/qrcode');
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const speakeasy = require('speakeasy');

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps before/after for clock skew
    } as VerifyOptions);

    return verified;
  } catch (error) {
    throw new Error(
      'speakeasy package is not installed. Run: npm install speakeasy @types/speakeasy'
    );
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join('-');

    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code for secure storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a backup code against stored hash
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const inputHash = hashBackupCode(code);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedCode));
}

/**
 * Encrypt sensitive 2FA data before storing in database
 */
export function encryptTwoFactorData(data: string, key?: string): string {
  const encryptionKey = key || process.env.TWO_FACTOR_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY environment variable is not set');
  }

  // Use AES-256-GCM for encryption
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV + AuthTag + Encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive 2FA data from database
 */
export function decryptTwoFactorData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.TWO_FACTOR_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY environment variable is not set');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const ivPart = parts[0];
  const authTagPart = parts[1];
  const encryptedPart = parts[2];

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivPart, 'hex');
  const authTag = Buffer.from(authTagPart, 'hex');
  const encrypted = encryptedPart;

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if 2FA packages are installed
 */
export function areTwoFactorPackagesInstalled(): boolean {
  try {
    require.resolve('speakeasy');
    require.resolve('qrcode');
    return true;
  } catch {
    return false;
  }
}

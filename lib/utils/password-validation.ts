/**
 * Enhanced password validation utilities
 * Provides client-side password strength checking and validation
 */

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  passed: boolean;
}

export interface PasswordRequirements {
  minLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minComplexity: number; // Minimum number of character types (2-4)
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  minComplexity: 3,
};

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: Partial<PasswordRequirements> = {}
): PasswordStrength {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length < reqs.minLength) {
    feedback.push(`Password must be at least ${reqs.minLength} characters long`);
  } else {
    score++;
  }

  // Check character types
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (reqs.requireLowercase && !hasLower) {
    feedback.push('Password must contain lowercase letters');
  }

  if (reqs.requireUppercase && !hasUpper) {
    feedback.push('Password must contain uppercase letters');
  }

  if (reqs.requireNumbers && !hasNumber) {
    feedback.push('Password must contain numbers');
  }

  if (reqs.requireSpecialChars && !hasSpecial) {
    feedback.push('Password must contain special characters');
  }

  if (complexity < reqs.minComplexity) {
    feedback.push(
      `Password must contain at least ${reqs.minComplexity} of: lowercase, uppercase, numbers, special characters`
    );
  } else {
    score++;
  }

  // Check for common patterns
  if (hasCommonPattern(password)) {
    feedback.push('Password contains common patterns (avoid sequences like "123", "abc")');
    score = Math.max(0, score - 1);
  } else {
    score++;
  }

  // Check length bonus
  if (password.length >= 12) {
    score++;
  }

  // Check complexity bonus
  if (complexity === 4) {
    score++;
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, score));

  const passed = feedback.length === 0 && score >= 2;

  return {
    score,
    feedback,
    passed,
  };
}

/**
 * Check if password contains common patterns
 */
function hasCommonPattern(password: string): boolean {
  const patterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i,
    /master/i,
    /(\w)\1{2,}/, // Repeated characters (aaa, 111, etc.)
    /(?:012|123|234|345|456|567|678|789|890)/, // Sequential numbers
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential letters
  ];

  return patterns.some((pattern) => pattern.test(password));
}

/**
 * Check if password contains user information
 */
export function containsUserInfo(password: string, userInfo: {
  name?: string;
  email?: string;
}): boolean {
  const lowerPassword = password.toLowerCase();

  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/);
    if (nameParts.some((part) => part.length > 3 && lowerPassword.includes(part))) {
      return true;
    }
  }

  if (userInfo.email) {
    const emailPrefix = userInfo.email.split('@')[0].toLowerCase();
    if (emailPrefix.length > 3 && lowerPassword.includes(emailPrefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  switch (score) {
    case 0:
    case 1:
      return { label: 'Weak', color: 'red' };
    case 2:
      return { label: 'Fair', color: 'orange' };
    case 3:
      return { label: 'Good', color: 'yellow' };
    case 4:
      return { label: 'Strong', color: 'green' };
    default:
      return { label: 'Unknown', color: 'gray' };
  }
}

/**
 * Generate a random secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + special;
  let password = '';

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check password against common breach databases
 * Note: This is a client-side check only. For production,
 * use a server-side API like Have I Been Pwned
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  message: string;
}> {
  // This would normally call an API like Have I Been Pwned
  // For now, just check against a list of most common passwords
  const mostCommonPasswords = [
    '123456',
    'password',
    '123456789',
    '12345678',
    '12345',
    '1234567',
    'password1',
    '123123',
    '1234567890',
    '000000',
    'qwerty',
    'abc123',
    'password123',
    '1q2w3e4r',
    'qwertyuiop',
    'monkey',
    '1234',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    '111111',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
  ];

  if (mostCommonPasswords.includes(password.toLowerCase())) {
    return {
      breached: true,
      message: 'This password is too common and has been found in data breaches. Please choose a different password.',
    };
  }

  return {
    breached: false,
    message: 'Password appears to be unique.',
  };
}

/**
 * Estimate time to crack password
 */
export function estimateCrackTime(password: string): string {
  const charset = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  let charsetSize = 0;
  if (charset.lowercase) charsetSize += 26;
  if (charset.uppercase) charsetSize += 26;
  if (charset.numbers) charsetSize += 10;
  if (charset.special) charsetSize += 32;

  const combinations = Math.pow(charsetSize, password.length);

  // Assume 1 billion attempts per second (modern GPU)
  const secondsToCrack = combinations / 1_000_000_000;

  if (secondsToCrack < 1) return 'Instant';
  if (secondsToCrack < 60) return `${Math.ceil(secondsToCrack)} seconds`;
  if (secondsToCrack < 3600) return `${Math.ceil(secondsToCrack / 60)} minutes`;
  if (secondsToCrack < 86400) return `${Math.ceil(secondsToCrack / 3600)} hours`;
  if (secondsToCrack < 31536000) return `${Math.ceil(secondsToCrack / 86400)} days`;
  if (secondsToCrack < 3153600000) return `${Math.ceil(secondsToCrack / 31536000)} years`;

  return 'Centuries';
}

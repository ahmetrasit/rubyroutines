/**
 * Environment Variable Validation
 *
 * Validates required environment variables on application startup.
 * Throws error if critical variables are missing to fail fast.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description?: string;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  // Database
  { name: 'DATABASE_URL', required: true, description: 'PostgreSQL database connection string' },

  // Supabase
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key (server-side)' },

  // App Configuration
  { name: 'NEXT_PUBLIC_APP_URL', required: true, description: 'Application URL' },
  { name: 'NEXTAUTH_URL', required: true, description: 'NextAuth URL (same as APP_URL)' },
  { name: 'NEXTAUTH_SECRET', required: true, description: 'NextAuth secret for session encryption' },

  // Security
  { name: 'TWO_FACTOR_ENCRYPTION_KEY', required: true, description: '2FA encryption key (64 hex characters)' },
  { name: 'JWT_SECRET', required: true, description: 'JWT secret for token signing' },

  // OAuth  { name: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID' },
  { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth client secret' },

  // Stripe (required for payments)
  { name: 'STRIPE_SECRET_KEY', required: true, description: 'Stripe secret key' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, description: 'Stripe publishable key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, description: 'Stripe webhook signing secret' },
  { name: 'STRIPE_PRICE_BRONZE', required: true, description: 'Stripe price ID for Bronze tier' },
  { name: 'STRIPE_PRICE_GOLD', required: true, description: 'Stripe price ID for Gold tier' },
  { name: 'STRIPE_PRICE_PRO', required: true, description: 'Stripe price ID for Pro tier' },

  // Email (optional - features degrade gracefully)
  { name: 'RESEND_API_KEY', required: false, description: 'Resend API key for email sending' },
  { name: 'EMAIL_FROM', required: false, description: 'Email sender address' },

  // Rate Limiting (optional - falls back to in-memory)
  { name: 'UPSTASH_REDIS_REST_URL', required: false, description: 'Upstash Redis URL for rate limiting' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false, description: 'Upstash Redis token' },
];

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validate environment variables
 * @throws {EnvValidationError} if required variables are missing
 */
export function validateEnv(): void {
  const missingVars: EnvVar[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        missingVars.push(envVar);
      } else {
        warnings.push(
          `Optional: ${envVar.name} not set. ${envVar.description || 'Some features may be disabled.'}`
        );
      }
    }
  }

  // Log warnings for optional variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Throw error for missing required variables
  if (missingVars.length > 0) {
    const errorMessage = [
      '\n❌ Missing required environment variables:',
      '',
      ...missingVars.map(v => `  - ${v.name}: ${v.description || 'Required'}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See .env.example for reference.',
      '',
    ].join('\n');

    throw new EnvValidationError(errorMessage);
  }

  // Additional validations
  validateTwoFactorKey();
  validateUrls();

  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Validate TWO_FACTOR_ENCRYPTION_KEY format
 */
function validateTwoFactorKey(): void {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (key && !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new EnvValidationError(
      'TWO_FACTOR_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.\n' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
}

/**
 * Validate URL formats
 */
function validateUrls(): void {
  const urlVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ];

  for (const varName of urlVars) {
    const url = process.env[varName];
    if (url) {
      try {
        new URL(url);
      } catch {
        throw new EnvValidationError(
          `${varName} is not a valid URL: ${url}\n` +
          'Expected format: https://example.com or http://localhost:3000'
        );
      }
    }
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value && fallback === undefined) {
    throw new EnvValidationError(`Environment variable ${name} is not set`);
  }
  return value || fallback || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

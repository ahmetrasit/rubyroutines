-- Add Two-Factor Authentication fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[];

-- Create index for 2FA queries
CREATE INDEX IF NOT EXISTS idx_users_two_factor ON users(two_factor_enabled) WHERE two_factor_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN users.two_factor_secret IS 'Encrypted TOTP secret for 2FA (base32 encoded)';
COMMENT ON COLUMN users.two_factor_backup_codes IS 'Array of encrypted backup codes for account recovery';

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

/**
 * Two-Factor Authentication Setup Component
 * Allows users to enable, disable, and manage 2FA
 */
export function TwoFactorSetup() {
  const [isSetup, setIsSetup] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    manualEntryKey: string;
  } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');

  const { data: packagesCheck } = trpc.twoFactor.checkPackages.useQuery();
  const { data: status, refetch: refetchStatus } = trpc.twoFactor.getStatus.useQuery();

  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      setSetupData(data);
      setIsSetup(true);
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const enableMutation = trpc.twoFactor.enable.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setIsSetup(false);
      setSetupData(null);
      setVerificationToken('');
      refetchStatus();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      setVerificationToken('');
      setError('');
      refetchStatus();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setVerificationToken('');
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleEnable = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    enableMutation.mutate({ token: verificationToken });
  };

  const handleDisable = () => {
    if (!verificationToken) {
      setError('Please enter your verification code or backup code');
      return;
    }
    disableMutation.mutate({ token: verificationToken });
  };

  const handleRegenerate = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    regenerateMutation.mutate({ token: verificationToken });
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ruby-routines-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!packagesCheck?.installed) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          2FA Packages Not Installed
        </h3>
        <p className="text-yellow-800 dark:text-yellow-200">
          Two-factor authentication requires additional packages. Please install them:
        </p>
        <code className="block mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded text-sm">
          npm install speakeasy qrcode @types/speakeasy @types/qrcode
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status?.enabled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                Disabled
              </span>
            )}
          </div>
        </div>

        {error && (
          <div
            className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Setup Flow */}
        {!status?.enabled && !isSetup && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enable two-factor authentication using an authenticator app like Google Authenticator,
              Authy, or 1Password.
            </p>
            <Button onClick={handleSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? 'Setting up...' : 'Set Up 2FA'}
            </Button>
          </div>
        )}

        {/* QR Code Step */}
        {isSetup && setupData && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Step 1: Scan QR Code</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan this QR code with your authenticator app
              </p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <Image
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Or enter this code manually</h4>
              <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                {setupData.manualEntryKey}
              </code>
            </div>

            <div>
              <h4 className="font-medium mb-2">Step 2: Verify</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter the 6-digit code from your authenticator app
              </p>
              <div className="flex gap-3">
                <div className="flex-1 max-w-xs">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    aria-label="Enter 6-digit verification code"
                  />
                </div>
                <Button
                  onClick={handleEnable}
                  disabled={enableMutation.isPending || verificationToken.length !== 6}
                >
                  {enableMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enabled State */}
        {status?.enabled && !showBackupCodes && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Two-factor authentication is currently enabled on your account.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBackupCodes(true)}>
                Regenerate Backup Codes
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
                    const token = prompt('Enter your current 6-digit code or backup code:');
                    if (token) {
                      setVerificationToken(token);
                      disableMutation.mutate({ token });
                    }
                  }
                }}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Backup Codes */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 p-6">
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
            Save Your Backup Codes
          </h3>
          <p className="text-orange-800 dark:text-orange-200 mb-4">
            Store these backup codes in a safe place. Each code can only be used once.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <code
                key={index}
                className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded text-center font-mono text-sm"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadBackupCodes}>
              Download Codes
            </Button>
            <Button onClick={() => setShowBackupCodes(false)}>
              I've Saved My Codes
            </Button>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Form */}
      {status?.enabled && showBackupCodes && backupCodes.length === 0 && (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Regenerate Backup Codes</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enter your current 6-digit authentication code to generate new backup codes.
          </p>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="000000"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="max-w-xs text-center text-2xl tracking-widest"
              aria-label="Enter 6-digit verification code"
            />
            <Button
              onClick={handleRegenerate}
              disabled={regenerateMutation.isPending || verificationToken.length !== 6}
            >
              {regenerateMutation.isPending ? 'Generating...' : 'Generate New Codes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

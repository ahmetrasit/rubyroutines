'use client';

import { TwoFactorSetup } from '@/components/two-factor-setup';

/**
 * Security Settings Page
 * Manage account security settings including 2FA
 */
export default function SecuritySettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Security Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account security and authentication methods
          </p>
        </div>

        <TwoFactorSetup />
      </div>
    </div>
  );
}

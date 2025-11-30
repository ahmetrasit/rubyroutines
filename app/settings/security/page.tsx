'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TwoFactorSetup } from '@/components/two-factor-setup';
import { HomeButton } from '@/components/home-button';

/**
 * Security Settings Page
 * Manage account security settings including 2FA
 */
export default function SecuritySettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <HomeButton />
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </div>

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

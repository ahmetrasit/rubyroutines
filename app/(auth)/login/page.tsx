'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        // User has 2FA enabled, show 2FA input
        setRequiresTwoFactor(true);
        setError('');
      } else {
        // Use window.location.href to force full page reload and pick up session cookies
        window.location.href = '/parent';
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const verifyTwoFactorMutation = trpc.auth.verifyTwoFactorLogin.useMutation({
    onSuccess: (data) => {
      if (data.usedBackupCode) {
        // Show a warning about using backup code before redirecting
        alert('You used a backup code. Please regenerate your backup codes in settings.');
      }
      // Use window.location.href to force full page reload and pick up session cookies
      window.location.href = '/parent';
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    signInMutation.mutate({ email, password });
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    verifyTwoFactorMutation.mutate({ email, password, token: twoFactorCode });
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode('');
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  // Show 2FA verification form
  if (requiresTwoFactor) {
    return (
      <div>
        <header className="text-center">
          <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
          <p className="mt-2 text-gray-600">Enter the code from your authenticator app</p>
        </header>

        <div className="mt-8 space-y-6">
          <form onSubmit={handleTwoFactorSubmit} className="space-y-4" aria-label="Two-factor authentication form">
            <div>
              <Label htmlFor="twoFactorCode">Verification Code</Label>
              <Input
                id="twoFactorCode"
                type="text"
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code or backup code"
                className="mt-1"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                You can also use a backup code if you don&apos;t have access to your authenticator.
              </p>
            </div>

            {error && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-800"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={verifyTwoFactorMutation.isPending}
              aria-label="Verify two-factor code"
            >
              {verifyTwoFactorMutation.isPending ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-gray-600">Log in to your account</p>
      </header>

      <div className="mt-8 space-y-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          aria-label="Sign in with Google"
        >
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>

        <div className="relative" role="separator" aria-label="Or">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/reset-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1"
            />
          </div>

          {error && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-red-800"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={signInMutation.isPending}
            aria-label="Submit login form"
          >
            {signInMutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Handle the code exchange when the page loads
  useEffect(() => {
    const handleCodeExchange = async () => {
      const code = searchParams?.get('code');

      if (code) {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setError('Invalid or expired reset link. Please request a new one.');
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
        }
      } else {
        // Check if we already have a session (user might have already exchanged the code)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsValidSession(true);
        } else {
          setError('Invalid reset link. Please request a new password reset.');
          setIsValidSession(false);
        }
      }
    };

    handleCodeExchange();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Sign out after password change for security
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div>
        <header className="text-center">
          <h1 className="text-3xl font-bold">Reset your password</h1>
          <p className="mt-2 text-gray-600">Verifying your reset link...</p>
        </header>
      </div>
    );
  }

  // Show error if link is invalid
  if (!isValidSession) {
    return (
      <div>
        <header className="text-center">
          <h1 className="text-3xl font-bold">Invalid Reset Link</h1>
          <p className="mt-2 text-gray-600">
            This password reset link is invalid or has expired.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <div
            className="rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>

          <Link href="/reset-password">
            <Button className="w-full">Request new reset link</Button>
          </Link>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div>
        <header className="text-center">
          <h1 className="text-3xl font-bold">Password updated</h1>
          <p className="mt-2 text-gray-600">
            Your password has been successfully reset.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            You can now log in with your new password.
          </div>

          <Link href="/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div>
      <header className="text-center">
        <h1 className="text-3xl font-bold">Set new password</h1>
        <p className="mt-2 text-gray-600">
          Enter your new password below.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Set new password form">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              minLength={6}
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
            disabled={isLoading}
            aria-label="Update password"
          >
            {isLoading ? 'Updating...' : 'Update password'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

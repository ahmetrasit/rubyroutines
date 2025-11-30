'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    requestResetMutation.mutate({ email });
  };

  if (success) {
    return (
      <div>
        <header className="text-center">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="mt-2 text-gray-600">
            If an account exists for {email}, we sent a password reset link.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            <p>
              Click the link in your email to reset your password. The link will expire in 1 hour.
            </p>
          </div>

          <p className="text-center text-sm text-gray-600">
            Didn&apos;t receive an email?{' '}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </p>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Password reset form">
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
              autoFocus
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
            disabled={requestResetMutation.isPending}
            aria-label="Send reset link"
          >
            {requestResetMutation.isPending ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

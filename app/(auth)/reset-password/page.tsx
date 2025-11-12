'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

type Step = 'request' | 'verify' | 'reset';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const requestMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Code sent!',
        description: 'Check your email for the reset code.',
        variant: 'success',
      });

      // Show code in development
      if (data.code) {
        console.log('Reset code:', data.code);
        toast({
          title: 'Development Mode',
          description: `Your code is: ${data.code}`,
          variant: 'default',
        });
      }

      setStep('verify');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const verifyMutation = trpc.auth.verifyPasswordResetCode.useMutation({
    onSuccess: () => {
      toast({
        title: 'Code verified!',
        description: 'Now enter your new password.',
        variant: 'success',
      });
      setStep('reset');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast({
        title: 'Password reset!',
        description: 'Your password has been reset successfully.',
        variant: 'success',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    requestMutation.mutate({ email });
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    verifyMutation.mutate({ email, code });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    resetMutation.mutate({ email, code, newPassword });
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-gray-600">
          {step === 'request' && "Enter your email to receive a reset code"}
          {step === 'verify' && "Enter the 6-digit code sent to your email"}
          {step === 'reset' && "Create your new password"}
        </p>
      </div>

      {step === 'request' && (
        <form onSubmit={handleRequestSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? 'Sending...' : 'Send reset code'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Log in
            </Link>
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerifySubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1 bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="code">Reset Code</Label>
            <Input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-1 text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={verifyMutation.isPending || code.length !== 6}
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Verify code'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back
            </button>
          </p>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1"
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
              placeholder="Re-enter your password"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      )}
    </div>
  );
}

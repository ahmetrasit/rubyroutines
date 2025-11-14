'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const urlCode = searchParams.get('code');

  useEffect(() => {
    if (!userId || !email) {
      router.push('/signup');
    }
  }, [userId, email, router]);

  // Auto-fill code from URL if present
  useEffect(() => {
    if (urlCode && urlCode.length === 6) {
      setCode(urlCode);
    }
  }, [urlCode]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return undefined;
    }
  }, [resendCooldown]);

  const verifyMutation = trpc.auth.verifyEmailCode.useMutation({
    onSuccess: async () => {
      setSuccess('Email verified successfully! Redirecting to your dashboard...');

      // Refresh the Supabase session to get updated user metadata
      const supabase = (await import('@/lib/supabase/client')).createClient();
      await supabase.auth.refreshSession();

      setTimeout(() => {
        window.location.href = '/parent'; // Use window.location for hard refresh
      }, 2000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resendMutation = trpc.auth.resendVerificationCode.useMutation({
    onSuccess: () => {
      setSuccess('Verification code resent! Please check your email.');
      setError('');
      setResendCooldown(60);
      setCanResend(false);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('Invalid verification link');
      return;
    }

    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    verifyMutation.mutate({ userId, code });
  };

  const handleResend = () => {
    if (!userId || !email || !canResend) return;

    setError('');
    setSuccess('');
    resendMutation.mutate({ userId, email });
  };

  if (!userId || !email) {
    return null;
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Verify your email</h1>
        <p className="mt-2 text-gray-600">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
              }}
              placeholder="Enter 6-digit code"
              className="mt-1 text-center text-2xl tracking-widest"
              maxLength={6}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              Code expires in 15 minutes
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={verifyMutation.isPending || code.length !== 6 || !!success}
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{' '}
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-normal text-blue-600 hover:text-blue-700"
              onClick={handleResend}
              disabled={!canResend || resendMutation.isPending}
            >
              {resendMutation.isPending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend code'}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

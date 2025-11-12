'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const emailFromParams = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromParams);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast({
        title: 'Email verified!',
        description: 'Your email has been verified successfully.',
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

  const resendMutation = trpc.auth.resendVerificationCode.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Code sent!',
        description: 'A new verification code has been sent to your email.',
        variant: 'success',
      });

      // Show code in development
      if (data.code) {
        console.log('Verification code:', data.code);
        toast({
          title: 'Development Mode',
          description: `Your code is: ${data.code}`,
          variant: 'default',
        });
      }

      // Start cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !code) {
      setError('Please enter your email and verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    verifyMutation.mutate({ email, code });
  };

  const handleResend = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    resendMutation.mutate({ email });
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Verify your email</h1>
        <p className="mt-2 text-gray-600">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
            disabled={!!emailFromParams}
          />
        </div>

        <div>
          <Label htmlFor="code">Verification Code</Label>
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
          <p className="mt-1 text-sm text-gray-500">
            Enter the 6-digit code from your email
          </p>
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
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={resendMutation.isPending || resendCooldown > 0}
            className="w-full"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : resendMutation.isPending
              ? 'Sending...'
              : 'Resend code'}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}

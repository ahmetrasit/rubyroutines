'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      router.push('/verify?email=' + encodeURIComponent(email));
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    signUpMutation.mutate({ name, email, password });
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-gray-600">Get started with Ruby Routines</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
            />
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="mt-1"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? 'Creating account...' : 'Sign up'}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

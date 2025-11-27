'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams?.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="mt-2 text-gray-600">
          We sent a verification link to <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start space-x-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                Verify your account through the verification link sent to you
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Click the link in the email to verify your account and get started.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Didn&apos;t receive the email?
          </h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes for the email to arrive</li>
          </ul>
        </div>

        <div className="text-center pt-4 space-y-2">
          <p className="text-sm text-gray-600">
            Already verified your email?{' '}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to login
            </a>
          </p>
          <p>
            <a
              href="/signup"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Back to signup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

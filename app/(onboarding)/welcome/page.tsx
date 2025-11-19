'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  const handleStart = () => {
    // Mark onboarding as started in localStorage
    localStorage.setItem('onboarding_started', 'true');
    router.push('/onboarding/role-selection');
  };

  const handleSkip = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/parent');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Ruby Routines! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Let's get you set up in just a few simple steps
          </p>
        </div>

        <div className="space-y-6 my-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Create Your First Person
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add a child, student, or yourself to get started
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Set Up a Routine
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from templates or create your own
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Complete Your First Task
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Experience the satisfaction of checking off a task
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            onClick={handleStart}
            className="flex-1 h-12 text-lg"
            size="lg"
          >
            Let's Get Started →
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="sm:w-32"
            size="lg"
          >
            Skip
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          This will only take about 2 minutes
        </p>
      </div>
    </div>
  );
}

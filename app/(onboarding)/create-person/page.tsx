'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function CreatePersonPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if onboarding was started
    const started = localStorage.getItem('onboarding_started');
    if (!started) {
      router.push('/welcome');
    }
  }, [router]);

  const handleContinue = () => {
    const role = localStorage.getItem('onboarding_role');
    localStorage.setItem('onboarding_completed', 'true');

    // Navigate to appropriate dashboard
    if (role === 'parent') {
      router.push('/parent');
    } else if (role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Step 2 of 4
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            You're All Set! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your account is ready. Let's explore Ruby Routines!
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Next Steps:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Add your first person
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a profile for a child, student, or yourself
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Create a routine
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up a daily routine with tasks to track
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Start tracking progress
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete tasks and watch streaks grow!
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleContinue}
            className="flex-1 h-12 text-lg"
            size="lg"
          >
            Go to Dashboard →
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            size="lg"
          >
            Explore First
          </Button>
        </div>
      </div>
    </div>
  );
}

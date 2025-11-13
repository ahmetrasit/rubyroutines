'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('onboarding_role', selectedRole);
      router.push('/onboarding/create-person');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Step 1 of 4
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            What best describes you?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This helps us customize your experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('parent')}
            className={`
              relative p-8 rounded-xl border-2 transition-all text-left
              ${
                selectedRole === 'parent'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }
            `}
            aria-label="Select parent role"
            aria-pressed={selectedRole === 'parent'}
          >
            {selectedRole === 'parent' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Parent
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage routines for your children at home
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Track multiple children
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Share with co-parents
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Kiosk mode for kids
              </li>
            </ul>
          </button>

          <button
            onClick={() => setSelectedRole('teacher')}
            className={`
              relative p-8 rounded-xl border-2 transition-all text-left
              ${
                selectedRole === 'teacher'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }
            `}
            aria-label="Select teacher role"
            aria-pressed={selectedRole === 'teacher'}
          >
            {selectedRole === 'teacher' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="text-5xl mb-4">👩‍🏫</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Teacher
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage routines for your students in the classroom
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Manage classrooms
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Share with co-teachers
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Track student progress
              </li>
            </ul>
          </button>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push('/welcome')}
            variant="outline"
          >
            ← Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

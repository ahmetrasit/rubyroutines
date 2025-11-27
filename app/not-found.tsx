/**
 * 404 Not Found Page
 * Handles all unmatched routes in the application
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="-mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

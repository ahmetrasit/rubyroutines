import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Ruby Routines',
  description: 'Cookie Policy for Ruby Routines',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              1. What Are Cookies?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Cookies are small text files stored on your device when you visit a
              website. They help websites remember your preferences and improve your
              experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              2. How We Use Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ruby Routines uses cookies for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              2.1 Essential Cookies (Required)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These cookies are necessary for the Service to function:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Authentication:</strong> Keep you logged in to your account
              </li>
              <li>
                <strong>Session Management:</strong> Maintain your session state
              </li>
              <li>
                <strong>Security:</strong> Prevent fraud and protect against attacks
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              2.2 Functional Cookies
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These cookies enhance functionality:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Preferences:</strong> Remember your settings (theme, language)
              </li>
              <li>
                <strong>User Interface:</strong> Remember which panels you've collapsed
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              2.3 Analytics Cookies
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These cookies help us understand how you use the Service:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Usage Analytics:</strong> Track page views and feature usage
              </li>
              <li>
                <strong>Performance:</strong> Monitor load times and errors
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              3. Third-Party Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use the following third-party services that may set cookies:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Stripe:</strong> Payment processing (required for billing)
              </li>
              <li>
                <strong>Supabase:</strong> Authentication and database services
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              4. Managing Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can control cookies through:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              4.1 Browser Settings
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (may affect functionality)</li>
              <li>Delete cookies when closing the browser</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              4.2 Browser-Specific Instructions
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Chrome:</strong> Settings {'>'} Privacy and security {'>'} Cookies
              </li>
              <li>
                <strong>Firefox:</strong> Settings {'>'} Privacy & Security {'>'} Cookies
              </li>
              <li>
                <strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Cookies
              </li>
              <li>
                <strong>Edge:</strong> Settings {'>'} Privacy {'>'} Cookies
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              5. Cookie Lifespan
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our cookies have the following lifespans:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Session Cookies:</strong> Deleted when you close your browser
              </li>
              <li>
                <strong>Persistent Cookies:</strong> Remain for up to 30 days
              </li>
              <li>
                <strong>Authentication Cookies:</strong> Remain until you log out
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              6. Do Not Track
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We respect Do Not Track (DNT) browser settings. When DNT is enabled, we
              will not set analytics or tracking cookies.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              7. Updates to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update this Cookie Policy to reflect changes in our practices or
              for legal reasons. We will notify you of significant changes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              8. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about our use of cookies, contact us at:
              <br />
              <a
                href="mailto:privacy@rubyroutines.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                privacy@rubyroutines.com
              </a>
            </p>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This is a template. Please have this cookie
                policy reviewed by a qualified attorney before using it in production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

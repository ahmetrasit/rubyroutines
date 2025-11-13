import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Ruby Routines',
  description: 'Privacy Policy for Ruby Routines',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ruby Routines ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Account information (name, email, password)</li>
              <li>Profile information</li>
              <li>
                Routine, task, and goal data you create
              </li>
              <li>Information about persons you add (names, avatars)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              2.2 Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and location data</li>
              <li>Usage data (pages visited, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Provide and maintain our Service</li>
              <li>Process your transactions</li>
              <li>Send you updates and notifications</li>
              <li>Improve our Service and develop new features</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
              <li>Provide customer support</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We do not sell your personal information. We may share your information
              with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Service Providers:</strong> Supabase (database), Stripe
                (payments), Vercel (hosting)
              </li>
              <li>
                <strong>Co-parents/Co-teachers:</strong> When you explicitly share
                access
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect
                our rights
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              5. Children's Privacy (COPPA Compliance)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service is designed for parents and teachers. We do not knowingly
              collect personal information from children under 13 without verifiable
              parental consent. If we learn we have collected information from a child
              under 13 without consent, we will delete it promptly.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Parents have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Review their child's information</li>
              <li>Request deletion of their child's information</li>
              <li>Refuse further collection of their child's information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              6. Your Rights (GDPR Compliance)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you are in the European Economic Area, you have the following rights:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Right to Access:</strong> Request a copy of your data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Correct inaccurate data
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request deletion of your data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your data in a
                machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing of your data
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent at any
                time
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To exercise these rights, visit your account settings or contact us at{' '}
              <a
                href="mailto:privacy@rubyroutines.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                privacy@rubyroutines.com
              </a>
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              7. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement appropriate technical and organizational measures to protect
              your data, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Encryption of data in transit (HTTPS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              8. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We retain your data for as long as your account is active or as needed to
              provide services. You can delete your account at any time, which will
              delete all associated data except as required by law.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              9. Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Maintain your session</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can control cookies through your browser settings.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              10. Third-Party Links
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service may contain links to third-party websites. We are not
              responsible for their privacy practices.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              11. Data Breach Notification
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In the event of a data breach that affects your personal information, we
              will notify you within 72 hours as required by GDPR.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              12. Changes to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you
              of any material changes by email or through the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about this Privacy Policy or to exercise your rights,
              contact us at:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Email:{' '}
              <a
                href="mailto:privacy@rubyroutines.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                privacy@rubyroutines.com
              </a>
            </p>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This is a template. Please have this privacy
                policy reviewed by a qualified attorney before using it in production,
                especially for GDPR and COPPA compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

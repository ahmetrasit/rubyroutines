import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Ruby Routines',
  description: 'Terms of Service for Ruby Routines',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and using Ruby Routines ("Service"), you accept and agree to
              be bound by the terms and provision of this agreement. If you do not
              agree to these Terms of Service, please do not use the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ruby Routines provides a routine management platform for parents and
              teachers to help organize and track tasks, routines, and goals for
              children and students.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or viruses</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Collect or harvest user data without permission</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              5. User Content
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain ownership of content you create. By using the Service, you
              grant us a license to use, store, and display your content solely for
              the purpose of providing the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              6. Children's Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service is designed for use by parents and teachers. We do not
              knowingly collect personal information from children under 13 without
              parental consent. See our Privacy Policy for more information.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              7. Subscription and Billing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Paid subscriptions renew automatically unless canceled. You may cancel
              your subscription at any time. Refunds are provided as described in our
              refund policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              8. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may terminate or suspend your account immediately, without prior
              notice, for conduct that we believe violates these Terms or is harmful
              to other users, us, or third parties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Service is provided "as is" without warranties of any kind, either
              express or implied. We do not guarantee that the Service will be
              error-free or uninterrupted.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To the maximum extent permitted by law, Ruby Routines shall not be
              liable for any indirect, incidental, special, consequential, or punitive
              damages resulting from your use of the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We reserve the right to modify these terms at any time. We will notify
              users of material changes via email or through the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
              12. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms, please contact us at:
              <br />
              <a
                href="mailto:legal@rubyroutines.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                legal@rubyroutines.com
              </a>
            </p>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This is a template. Please have these terms
                reviewed by a qualified attorney before using them in production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

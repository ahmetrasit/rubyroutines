import Link from 'next/link';

export default function LimitsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Tier Limits</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tier Limits</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Understanding what each plan includes</p>
          </div>
        </div>
      </div>

      {/* Parent Mode Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Parent Mode Limits</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Free</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">Standard</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Premium</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Children</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">2</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Routines per child</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Tasks per routine</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Kiosk sessions</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Co-parent sharing</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Goals</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1 per child</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5 per child</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">History retention</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">30 days</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1 year</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Forever</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Teacher Mode Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Teacher Mode Limits</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Free</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">Standard</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Premium</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Classrooms</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Students per classroom</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">15</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">40</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Routines per classroom</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Bulk check-in</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Parent connections</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Principal Mode Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Principal Mode (School) Limits</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Free</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Standard</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">Premium</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Schools</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Multiple</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Teachers</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Support staff</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">2</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total students</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">500</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">School-wide routines</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">2</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Plan Overview</h2>

        <div className="not-prose grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$0</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Perfect for trying out Ruby Routines with a small family or classroom.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>All core features</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Kiosk mode</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Co-parent sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500">~</span>
                <span>Limited capacity</span>
              </li>
            </ul>
          </div>

          {/* Standard */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Standard</h3>
              <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Popular</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$9<span className="text-lg font-normal text-gray-500">/mo</span></div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              For growing families and active classrooms that need more space.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>10x more capacity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>1 year history</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          {/* Premium */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border-2 border-amber-300 dark:border-amber-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$29<span className="text-lg font-normal text-gray-500">/mo</span></div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              For schools and large organizations with unlimited needs.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Everything in Standard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Unlimited everything</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Multiple schools</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Forever history</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Happens When You Hit a Limit */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Happens at Limits</h2>

        <div className="not-prose bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-xl">ℹ️</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Soft limits</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  When you reach a limit, you&apos;ll see a friendly message explaining what&apos;s happening. Existing data is never deleted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl">🔒</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Adding is blocked</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You won&apos;t be able to add more items (children, routines, etc.) until you upgrade or remove existing ones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl">✨</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Upgrade anytime</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Upgrade your plan from account settings. New limits apply immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/features/marketplace" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Marketplace</span>
          </Link>
          <Link href="/guide" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Back to Guide Home</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

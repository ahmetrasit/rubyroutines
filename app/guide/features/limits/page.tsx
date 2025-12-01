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
        <h2 className="text-2xl font-bold mb-6">Parent Mode Tiers</h2>

        <div className="not-prose">
          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 min-w-[700px]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Free</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">Tiny<br/><span className="text-xs font-normal">$1.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-green-600 dark:text-green-400">Small<br/><span className="text-xs font-normal">$3.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">Medium<br/><span className="text-xs font-normal">$7.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Large<br/><span className="text-xs font-normal">$12.99/mo</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Children</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total routines</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">200</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">500</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Tasks per routine</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Goals</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">200</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">200</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Co-parents</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Kiosk codes</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Smart routines</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">2</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Mode Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Teacher Mode Tiers</h2>

        <div className="not-prose">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Usage-based pricing:</strong> Teacher tiers are based on active student count.
                Your tier automatically adjusts based on how many students you have.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 min-w-[700px]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Free<br/><span className="text-xs font-normal">1-3 students</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">Tiny<br/><span className="text-xs font-normal">4-7 students<br/>$2.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-green-600 dark:text-green-400">Small<br/><span className="text-xs font-normal">8-15 students<br/>$5.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">Medium<br/><span className="text-xs font-normal">16-23 students<br/>$9.99/mo</span></th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Large<br/><span className="text-xs font-normal">24+ students<br/>$9.99 + $0.10/student</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Max students</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">7</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">15</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">23</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total routines</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">200</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">500</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Tasks per routine</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Goals</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">3</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">200</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Co-teachers</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">2</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">10</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Kiosk codes</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">5</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">20</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">50</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* School Mode Pricing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">School Mode Pricing</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🏫</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Annual School Subscription
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  School Mode uses simple, transparent yearly pricing based on your student count.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  $299<span className="text-lg font-normal text-gray-500">/year</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Base subscription fee (paid upfront)
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  +$1<span className="text-lg font-normal text-gray-500">/student</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Per active student, per year
                </p>
              </div>
            </div>

            <div className="mt-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example pricing:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 100 students: $299 + $100 = <strong>$399/year</strong></li>
                <li>• 300 students: $299 + $300 = <strong>$599/year</strong></li>
                <li>• 500 students: $299 + $500 = <strong>$799/year</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* All Plans Include */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">All Plans Include</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-green-500">✓</span> Core Features
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li>• Kiosk Mode for self-check-in</li>
              <li>• All task types (check-off, counter, time)</li>
              <li>• Customizable reset periods</li>
              <li>• Progress tracking & history</li>
              <li>• Dark mode support</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-green-500">✓</span> Community Access
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li>• Browse community routines</li>
              <li>• Import templates for free</li>
              <li>• Share your own routines</li>
              <li>• No premium paywall</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Happens at Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Happens at Limits</h2>

        <div className="not-prose bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-xl">ℹ️</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Soft limits</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  When you reach a limit, you&apos;ll see a friendly message. Existing data is never deleted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl">🔒</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Adding is paused</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You won&apos;t be able to add more items until you upgrade or remove existing ones.
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

            <div className="flex items-start gap-4">
              <span className="text-xl">📉</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Downgrade gracefully</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  If you downgrade, you keep all your data. You just can&apos;t add more until you&apos;re within limits.
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
            <span>Routine Community</span>
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

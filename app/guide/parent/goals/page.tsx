import Link from 'next/link';

export default function GoalsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/parent" className="hover:text-purple-600">Parent Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Goals</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Set gentle, long-term objectives for your child</p>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Our Approach to Goals</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Goals in Ruby Routines are designed to be <strong>gentle markers</strong>, not high-pressure targets. We believe in:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">●</span>
                    <span><strong>Long-term thinking:</strong> Goals span weeks or months, not days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">●</span>
                    <span><strong>Process over outcome:</strong> Focus on consistency, not perfection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">●</span>
                    <span><strong>No punishment:</strong> Missing a goal has no negative consequences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">●</span>
                    <span><strong>Intrinsic motivation:</strong> Goals help children see their own progress</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="text-center mb-4">
                  <span className="text-4xl">🌱</span>
                </div>
                <blockquote className="text-center text-gray-600 dark:text-gray-300 italic text-sm">
                  &quot;Goals are not about being perfect. They&apos;re about building awareness of patterns and celebrating genuine growth.&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creating a Goal */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Creating a Goal</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Navigate to Goals</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From the child&apos;s profile, find the &quot;Goals&quot; tab</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Click &quot;Add Goal&quot;</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open the goal creation form</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Select a Task</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose which task this goal tracks</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Set Target & Duration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Define what success looks like</p>
                  </div>
                </div>
              </div>

              {/* Visual Form */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Goal Configuration</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Task</label>
                    <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm flex items-center gap-2">
                      <span>📚</span>
                      <span>Read for 20 minutes</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Goal Type</label>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm">Completion Rate</span>
                      <span className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm">Total Value</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target</label>
                      <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">80%</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Duration</label>
                      <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">30 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goal Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Goal Types</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          {/* Completion Rate */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Completion Rate</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Percentage of days completed</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tracks what percentage of possible completions were achieved over the goal period.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Example:</div>
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                &quot;Complete &apos;Brush teeth&apos; at least 80% of days this month&quot;
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>24/30 days (80%)</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-2xl">🔢</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Total Value</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cumulative amount over time</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tracks the total accumulated value for progress-type tasks.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Example:</div>
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                &quot;Read a total of 500 minutes this month&quot;
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>380/500 minutes</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Viewing Progress */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Viewing Progress</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Goal progress is displayed in multiple places:
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Child Dashboard</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">See active goals at a glance</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Goals Tab</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Detailed progress and history</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Kiosk (Optional)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Can be shown to motivate child</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Practices</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                <span>✓</span> Do
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <span>Set achievable targets (70-80% is great for daily tasks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <span>Use longer durations (30+ days) to see real patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <span>Discuss goals with your child so they feel ownership</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <span>Celebrate reaching goals without material rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <span>Adjust goals based on what you learn</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                <span>✗</span> Avoid
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <span>Setting 100% completion targets (unrealistic for children)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <span>Very short goal periods (less than a week)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <span>Using goals as a basis for punishment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <span>Creating too many goals at once (1-3 is ideal)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <span>Comparing one child&apos;s goals to another&apos;s</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Example Goals */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Example Goals</h2>

        <div className="not-prose">
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📚</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Reading Goal</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Read at least 400 minutes total</p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Total Value</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">30 days • Good for: Building a reading habit over time</div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🪥</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Dental Hygiene</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Brush teeth 75% of mornings</p>
                  </div>
                </div>
                <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded">Completion Rate</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">30 days • Good for: Establishing daily habits</div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎹</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Piano Practice</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Practice 3 times per week (85%)</p>
                  </div>
                </div>
                <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded">Completion Rate</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">60 days • Good for: Tracking weekly activities</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens when a goal ends?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              The goal is marked as complete (achieved or not) and moved to history. You can create a new goal for the same task if you want to continue tracking.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I edit an active goal?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes, you can adjust the target or end date. However, it&apos;s often better to complete the current goal and start a new one with adjusted parameters.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Should I show goals to my child?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This depends on your child. Some children are motivated by seeing progress; others may feel pressured. We recommend discussing goals openly but not making them the focus of daily check-ins.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/parent/coparent" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Co-Parent Sharing</span>
          </Link>
          <Link href="/guide/teacher" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Teacher Mode</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

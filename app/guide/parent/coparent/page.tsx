import Link from 'next/link';

export default function CoParentGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/parent" className="hover:text-purple-600">Parent Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Co-Parent Sharing</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-3xl">🤝</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Co-Parent Sharing</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Share and sync routines between parents</p>
          </div>
        </div>
      </div>

      {/* What is Co-Parent Sharing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is Co-Parent Sharing?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Co-Parent Sharing allows two parents (or caregivers) to manage the same child&apos;s routines. Each parent maintains their own account but can share specific routines with the other parent.
            </p>

            {/* Visual Diagram */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Parent 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">👩</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Parent A</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Morning Routine<br />Homework
                  </div>
                </div>

                {/* Arrow 1 */}
                <div className="text-green-500 text-2xl">↔</div>

                {/* Child */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2 border-4 border-amber-300 dark:border-amber-600">
                    <span className="text-3xl">🦄</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">Emma</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    Merged Kiosk View
                  </div>
                </div>

                {/* Arrow 2 */}
                <div className="text-green-500 text-2xl">↔</div>

                {/* Parent 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">👨</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Parent B</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Bedtime Routine<br />Weekend Chores
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>

        <div className="not-prose">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create a Link Request</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    From your child&apos;s profile, go to &quot;Co-Parent&quot; settings and generate a link invitation. You&apos;ll get a unique code to share.
                  </p>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 inline-block">
                    <div className="text-xs text-gray-500 mb-1">Share this code:</div>
                    <span className="font-mono text-lg font-bold text-green-600 dark:text-green-400">LINK-A7X9-B3Z2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Other Parent Accepts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    The other parent enters the code in their app. They&apos;ll need their own Ruby Routines account.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-green-500">✓</span>
                    <span>Both parents must have accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select Routines to Share</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Choose which of your routines should be visible to the other parent and appear in the child&apos;s merged kiosk.
                  </p>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">🌅 Morning Routine</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded ml-auto">Shared</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">📚 Homework</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded ml-auto">Shared</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">🎮 Weekend Screen Time</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded ml-auto">Private</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Merged Kiosk Experience</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    When the child opens kiosk, they see routines from <strong>both</strong> parents merged together. Task completions are tracked for either parent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bidirectional Link</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Both parents can see and manage shared routines. Each parent controls which of their routines are shared.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">✅</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unified Completions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Task completions sync between both parents. If a task is checked in the child&apos;s kiosk, both parents see it as complete.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Private Routines</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Keep some routines private. Only shared routines appear in the merged kiosk—you control what the other parent sees.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Separate Kiosks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Each household can have its own kiosk device. Sessions work independently but show the merged view.
            </p>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Important Notes</h2>

        <div className="not-prose space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-4">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ownership Stays Separate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Each parent still &quot;owns&quot; their own routines. The other parent can see shared routines but cannot edit them. To make changes, the routine owner must edit it.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Duplicate Children</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  If both parents created the child independently before linking, you may have duplicate child profiles. After linking, consider using one parent&apos;s child profile as the primary.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex gap-4">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Sync</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Changes sync in real-time. If one parent marks a task complete, the other parent&apos;s view updates within seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Removing a Link */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Removing a Co-Parent Link</h2>

        <div className="not-prose bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex gap-4">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Either parent can remove the link at any time. This will:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Stop syncing routines between accounts</li>
                <li>• Remove shared routines from the other parent&apos;s view</li>
                <li>• Keep each parent&apos;s own routines intact</li>
                <li>• Preserve completion history for owned routines</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                To remove: Go to the child&apos;s Co-Parent settings and click &quot;Remove Link.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I link with more than one person?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Currently, each child can have one co-parent link. This connects two accounts for that specific child.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What if we have multiple children?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You&apos;ll need to set up a co-parent link for each child separately. This allows flexibility—you might share routines for one child but not another.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Do both parents need a paid plan?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Each parent&apos;s plan limits apply to their own routines. If one parent has a free plan and creates 3 routines (the max), they can still see the other parent&apos;s shared routines.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/parent/kiosk" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Kiosk Mode</span>
          </Link>
          <Link href="/guide/parent/goals" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Goals</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

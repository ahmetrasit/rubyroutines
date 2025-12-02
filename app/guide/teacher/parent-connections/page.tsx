import Link from 'next/link';

export default function ParentConnectionsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-blue-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/teacher" className="hover:text-blue-600">Teacher Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Parent Connections</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <span className="text-3xl">🤝</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Parent Connections</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Link students with their parents&apos; accounts for visibility</p>
          </div>
        </div>
      </div>

      {/* What are Parent Connections */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What are Parent Connections?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Parent Connections link a student in your classroom to their parent&apos;s Ruby Routines account. This allows parents to see their child&apos;s school progress alongside their home routines.
            </p>

            {/* Visual Diagram */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {/* Teacher */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">👩‍🏫</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Teacher</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Classroom data</div>
                </div>

                {/* Arrow */}
                <div className="text-amber-500 text-2xl">→</div>

                {/* Student */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2 border-4 border-green-300 dark:border-green-600">
                    <span className="text-3xl">🦊</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Alex</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Linked</div>
                </div>

                {/* Arrow */}
                <div className="text-amber-500 text-2xl">→</div>

                {/* Parent */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">👨</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Parent</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Can view progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Benefits of Connecting Parents</h2>

        <div className="not-prose grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">👁️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Visibility</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Parents can see their child&apos;s school routines and progress in their own app.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unified View</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Home and school routines appear together in the parent&apos;s dashboard.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🤝</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Partnership</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Teachers and parents can work together on consistent expectations.
            </p>
          </div>
        </div>
      </section>

      {/* How to Create a Connection */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Creating a Parent Connection</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open Student Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click on a student in your classroom to open their profile.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click &quot;Connect Parent&quot;</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find the Parent Connection section and click the Connect button.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generate a Link Code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">A unique code is generated that you share with the parent.</p>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 inline-block">
                    <div className="text-xs text-gray-500 mb-1">Share this code with the parent:</div>
                    <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">LINK-X4K9-M2P7</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Parent Accepts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">The parent enters the code in their Ruby Routines app to complete the connection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Parents See */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Parents See</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="bg-purple-600 text-white px-6 py-3">
              <span className="font-semibold">Parent Dashboard View</span>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Home Routines */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏠</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Home Routines</h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                      <span>Morning Routine - 4/4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-yellow-500 flex items-center justify-center text-white text-xs">~</span>
                      <span>Bedtime Routine - 2/5</span>
                    </div>
                  </div>
                </div>

                {/* School Routines */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏫</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">School Routines</h4>
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded ml-auto">From Teacher</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                      <span>Morning Check-in - 3/3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                      <span>Homework Complete - 1/1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Permissions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Privacy & Permissions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-4">
              <span className="text-2xl">👀</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Only</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Parents can <strong>view</strong> school routine progress but cannot edit tasks or modify routines. Only teachers control school data.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Separate Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Home routines remain private to the parent. Teachers cannot see the child&apos;s home routine data.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-4">
              <span className="text-2xl">🔗</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Revocable</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Either the teacher or parent can disconnect the link at any time. The student profile remains intact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Managing Connections */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Managing Connections</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">✅</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Connected Parents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See which students have parent connections from the student list. A badge indicates connected students.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Disconnect</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Remove a parent connection from the student&apos;s profile if needed. The parent will no longer see school data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📧</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resend Code</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If a parent lost the link code, you can generate a new one from the student&apos;s profile.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">👨‍👩‍👧</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Parents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              A student can be linked to multiple parent accounts (e.g., both mom and dad).
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Do parents need to pay for an account?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Parents can use the free tier to view their child&apos;s school progress. Paid features only affect their own home routines.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What if the parent already has the child in their account?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              The connection links your classroom student to their existing child profile. School and home routines will appear together on the same child.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is parent connection required?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No, it&apos;s optional. You can use Ruby Routines for your classroom without any parent connections. It&apos;s simply an added feature for parent visibility.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/teacher/bulk-checkin" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span>←</span>
            <span>Bulk Check-in</span>
          </Link>
          <Link href="/guide/principal" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <span>Principal Mode</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

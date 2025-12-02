import Link from 'next/link';

export default function BulkCheckinGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-blue-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/teacher" className="hover:text-blue-600">Teacher Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Bulk Check-in</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk Check-in</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Efficiently track tasks for your whole class at once</p>
          </div>
        </div>
      </div>

      {/* What is Bulk Check-in */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is Bulk Check-in?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Bulk Check-in is a powerful tool that lets you mark task completions for multiple students at once. Instead of clicking through each student individually, you see everyone in a grid and can quickly toggle completions.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Save Time</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mark an entire class in seconds</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">👁️</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Visual Overview</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">See who completed what at a glance</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Updates</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to toggle any completion</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Grid Interface */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">The Grid Interface</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Bulk Check-in: Morning Routine</span>
                <span className="text-sm opacity-80">3rd Grade - Room 204</span>
              </div>
            </div>

            {/* Grid */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-3">Student</th>
                    <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2">Attendance</th>
                    <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2">Homework</th>
                    <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2">Reading</th>
                    <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2">Clean Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {[
                    { name: 'Alex', avatar: '🦊', tasks: [true, true, true, false] },
                    { name: 'Emma', avatar: '🦋', tasks: [true, true, false, true] },
                    { name: 'Jake', avatar: '🚀', tasks: [true, false, true, true] },
                    { name: 'Sofia', avatar: '🌟', tasks: [true, true, true, true] },
                  ].map((student) => (
                    <tr key={student.name}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{student.avatar}</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{student.name}</span>
                        </div>
                      </td>
                      {student.tasks.map((done, i) => (
                        <td key={i} className="text-center py-3 px-2">
                          <button className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            done
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-500'
                          }`}>
                            {done && <span>✓</span>}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Not done (click to mark)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How to Use Bulk Check-in</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select a Classroom</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">From your Teacher dashboard, click on the classroom you want to check in.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click &quot;Bulk Check-in&quot;</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find the Bulk Check-in button in the classroom view.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select a Routine</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose which routine you&apos;re checking in (Morning, Homework, etc.).</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click Cells to Toggle</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click any cell to toggle between complete/incomplete. Changes save automatically.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips & Tricks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Tips & Tricks</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl mb-3">🖱️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Row Check</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              To mark all tasks for one student, you can click through their row quickly. Each click immediately saves.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Works on Tablets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bulk check-in is touch-friendly. Great for walking around the classroom with a tablet!
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Undo Mistakes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Clicked the wrong cell? Just click again to toggle it back. No confirmation needed.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Check Past Days</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use the date selector to check in for previous days if you missed one.
            </p>
          </div>
        </div>
      </section>

      {/* When to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">When to Use Bulk Check-in</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">✓</span> Best For
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span>Morning routines (attendance, homework check)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span>End-of-day check-outs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span>Weekly chore/responsibility tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span>Simple yes/no tasks</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">💡</span> Consider Individual View For
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    <span>Progress-type tasks (entering specific values)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    <span>Multiple-type tasks (counting 1-9)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    <span>Individual discussions with students</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Are changes saved automatically?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes! Every click immediately saves. You don&apos;t need to press a Save button.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can parents see these check-ins?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If the student is linked to a parent account, yes—the parent can see their child&apos;s school progress. See <Link href="/guide/teacher/parent-connections" className="text-blue-600 dark:text-blue-400 hover:underline">Parent Connections</Link>.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What about students who are absent?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Simply leave their row unchecked. You can optionally create an &quot;Attendance&quot; task to track presence separately.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/teacher/students" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span>←</span>
            <span>Students</span>
          </Link>
          <Link href="/guide/teacher/parent-connections" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <span>Parent Connections</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

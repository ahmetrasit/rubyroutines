import Link from 'next/link';

export default function ParentGuideOverview() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Hero */}
      <div className="not-prose mb-12">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">👨‍👩‍👧‍👦</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Parent Mode Guide
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Everything you need to manage your family&apos;s routines
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Flow Diagram */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How Parent Mode Works</h2>

        <div className="not-prose">
          {/* Visual Flow */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">👶</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">1. Add Children</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create profiles for each child</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">2. Create Routines</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Morning, homework, bedtime, etc.</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">3. Add Tasks</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Brush teeth, read 20 mins, etc.</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">4. Use Kiosk</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kids check off tasks themselves</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>

        <div className="not-prose grid md:grid-cols-2 gap-4">
          <Link href="/guide/parent/children" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👶</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Managing Children
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Add, edit, and organize your children&apos;s profiles
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/parent/routines" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Routines & Tasks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Create routines and add tasks with different types
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/parent/kiosk" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Kiosk Mode
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Set up self-service check-in for your children
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/parent/coparent" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    Co-Parent Sharing
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Share routines between parents with merged kiosk
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Dashboard Walkthrough */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Dashboard</h2>

        <div className="not-prose">
          {/* Mock Dashboard */}
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-semibold">Parent Dashboard</span>
              <div className="flex gap-2">
                <span className="bg-purple-500 px-3 py-1 rounded text-sm">Parent Mode</span>
                <span className="bg-purple-700 px-3 py-1 rounded text-sm">Teacher Mode</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Child Card Example */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center text-xl">
                      🦄
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Emma</div>
                      <div className="text-xs text-gray-500">3 routines</div>
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    ← Child card
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-xl">
                      🚀
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Jake</div>
                      <div className="text-xs text-gray-500">2 routines</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ← Click to see routines
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-green-300 dark:border-green-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">➕</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Add Child</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800"></span>
            <span>Your dashboard shows all your children at a glance</span>
          </div>
        </div>
      </section>

      {/* Use Case Infographic */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Typical Use Case: Morning Routine</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🌅</span>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Morning Routine Example</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Task List */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Tasks to Check Off:</h4>
                <div className="space-y-3">
                  {[
                    { task: 'Wake up', type: 'Simple', icon: '⏰' },
                    { task: 'Brush teeth', type: 'Simple', icon: '🪥' },
                    { task: 'Get dressed', type: 'Simple', icon: '👕' },
                    { task: 'Eat breakfast', type: 'Simple', icon: '🥣' },
                    { task: 'Pack backpack', type: 'Simple', icon: '🎒' },
                    { task: 'Read for 20 min', type: 'Progress', icon: '📚' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                      <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-900 dark:text-white">{item.task}</span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Why This Works:</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Visual structure</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Children see exactly what needs to be done—no need to remember
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Self-directed</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Kids check tasks themselves in kiosk mode—builds independence
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Resets daily</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Each morning is a fresh start—no pressure from yesterday
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Progress tracking</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        &quot;Read 20 min&quot; uses progress type for numeric tracking
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Concepts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Concepts</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span> Routines
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              A routine is a collection of related tasks. Examples:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Morning Routine</li>
              <li>• Homework Time</li>
              <li>• Bedtime Routine</li>
              <li>• Weekly Chores</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">✅</span> Tasks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Individual items to complete. Three types available:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• <strong>Simple:</strong> One-time checkbox</li>
              <li>• <strong>Multiple:</strong> Count up to 9</li>
              <li>• <strong>Progress:</strong> Track numeric values</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">🔄</span> Reset Periods
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              When tasks reset to unchecked:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• <strong>Daily:</strong> Resets at 11:55 PM</li>
              <li>• <strong>Weekly:</strong> Pick a day to reset</li>
              <li>• Tasks automatically clear for fresh start</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📱</span> Kiosk Mode
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              A special mode for children to use:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Generate a code (valid 10 min)</li>
              <li>• Session lasts 90 days</li>
              <li>• Child sees only their tasks</li>
              <li>• Clean, distraction-free interface</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="not-prose">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Next Steps</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/guide/parent/children" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">👶</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add Children</span>
            </Link>
            <Link href="/guide/parent/routines" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">📋</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Routines</span>
            </Link>
            <Link href="/guide/parent/kiosk" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">📱</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Setup Kiosk</span>
            </Link>
            <Link href="/guide/parent/goals" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">🎯</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Set Goals</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

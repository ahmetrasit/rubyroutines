import Link from 'next/link';

export default function TaskTypesGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Task Types</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Types</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Understanding the three types of tasks in Ruby Routines</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Overview</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Ruby Routines offers three task types to match different kinds of activities. Each type has its own way of tracking completion.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">✓</div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Simple</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Done or not done</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔢</div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Multiple</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Count to a target (1-9)</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Progress</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track any number</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Tasks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Simple Tasks</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Simple Task</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">One-tap completion</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  A simple checkbox. Tap once to mark complete, tap again to undo. Perfect for binary tasks.
                </p>

                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Best for:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Brush teeth</li>
                  <li>• Make bed</li>
                  <li>• Take vitamins</li>
                  <li>• Pack backpack</li>
                  <li>• Homework complete</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">How it looks:</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Not completed</span>
                  </div>
                  <div className="text-center text-gray-400">↓ tap ↓</div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 line-through">Completed!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multiple Tasks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Multiple Tasks</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-2xl">🔢</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Multiple Task</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Count repetitions (1-9)</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Count up from 0 to a target number (max 9). Each tap increases the count. Great for repeated activities.
                </p>

                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Best for:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Drink 5 glasses of water</li>
                  <li>• Do 3 math problems</li>
                  <li>• Practice piano 4 times</li>
                  <li>• Read 2 chapters</li>
                  <li>• Complete 6 exercises</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">How it looks:</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Glasses of water</div>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div
                          key={num}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                            num <= 3
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">3 / 5 complete</div>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                  <strong className="text-blue-800 dark:text-blue-300">Tip:</strong>
                  <span className="text-blue-700 dark:text-blue-400 ml-1">Tap + to increase, - to decrease the count.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tasks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Progress Tasks</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Progress Task</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track any numeric value</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Enter any number toward a goal. Perfect for tracking time, quantities, or any measurable activity.
                </p>

                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Best for:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Read for 20 minutes</li>
                  <li>• Practice spelling 30 words</li>
                  <li>• Exercise for 15 minutes</li>
                  <li>• Write 100 words</li>
                  <li>• Save $50 this week</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">How it looks:</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">📚 Reading time</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">15 / 20 min</span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-sm">+5</button>
                    <button className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-sm">+10</button>
                    <div className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm text-center">
                      15
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                  <strong className="text-amber-800 dark:text-amber-300">Tip:</strong>
                  <span className="text-amber-700 dark:text-amber-400 ml-1">You can type any value or use quick-add buttons.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Comparison</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Simple</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Multiple</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Progress</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Completion style</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Checkbox</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Counter</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Number input</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Max target</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">1</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">9</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Best for</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">One-time actions</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Repetitions</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Time/quantity</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Goal tracking</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Completion rate</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Completion rate</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">Total value</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Choosing the Right Type */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Choosing the Right Type</h2>

        <div className="not-prose bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-xl mt-0.5">🤔</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Is it a yes/no activity?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Use <strong>Simple</strong> — one tap and done.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl mt-0.5">🔁</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Does it repeat a small number of times?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Use <strong>Multiple</strong> — count each repetition (up to 9).</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl mt-0.5">📏</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Do you need to track a specific amount?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Use <strong>Progress</strong> — enter any number toward your goal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/principal/staff" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Teachers & Staff</span>
          </Link>
          <Link href="/guide/features/visibility" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Visibility Settings</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

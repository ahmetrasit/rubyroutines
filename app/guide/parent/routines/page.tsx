import Link from 'next/link';

export default function RoutinesGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/parent" className="hover:text-purple-600">Parent Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Routines & Tasks</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Routines & Tasks</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Build structured routines with different task types</p>
          </div>
        </div>
      </div>

      {/* What is a Routine */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is a Routine?</h2>

        <div className="not-prose bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            A <strong>routine</strong> is a collection of related tasks that repeat on a schedule. Routines help organize a child&apos;s day into manageable chunks.
          </p>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: '🌅', name: 'Morning', example: 'Brush teeth, Get dressed, Eat breakfast' },
              { icon: '📚', name: 'Homework', example: 'Math worksheet, Reading 20 min, Spelling practice' },
              { icon: '🌙', name: 'Bedtime', example: 'Shower, Pajamas, Read story, Lights out' },
              { icon: '🧹', name: 'Chores', example: 'Make bed, Laundry, Take out trash' },
            ].map((routine) => (
              <div key={routine.name} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl mb-2">{routine.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{routine.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{routine.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creating a Routine */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Creating a Routine</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select a Child</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click on a child&apos;s card from your dashboard to view their routines.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click &quot;Add Routine&quot;</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Look for the + button to create a new routine.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Configure Routine Settings</h3>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mt-3 border border-gray-200 dark:border-gray-600">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Routine Name</label>
                        <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">Morning Routine</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Icon</label>
                        <div className="flex gap-2">
                          {['🌅', '📚', '🌙', '🧹', '⚽', '🎵'].map((emoji) => (
                            <div key={emoji} className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                              {emoji}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reset Period</label>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm">Daily</span>
                          <span className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm">Weekly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add Tasks to Your Routine</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Once saved, you can add individual tasks to the routine.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Periods */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Reset Periods</h2>

        <div className="not-prose">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The reset period determines when all tasks in a routine reset to &quot;not done.&quot;
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔄</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Daily Reset</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Tasks reset at <strong>11:55 PM</strong> each night</li>
                <li>• Perfect for morning routines, bedtime routines</li>
                <li>• Fresh start every day</li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Example:</div>
                <div className="text-sm text-gray-900 dark:text-white">&quot;Morning Routine&quot; — resets every night so it&apos;s ready for the next morning</div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Weekly Reset</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Choose which day the routine resets</li>
                <li>• Perfect for weekly chores, allowance tasks</li>
                <li>• Accumulates over the week</li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Example:</div>
                <div className="text-sm text-gray-900 dark:text-white">&quot;Weekly Chores&quot; — resets every Sunday, child completes tasks throughout the week</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Task Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Task Types</h2>

        <div className="not-prose">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Each task can be one of three types, depending on how you want to track completion:
          </p>

          <div className="space-y-6">
            {/* Simple Task */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✓</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Simple Task</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">A one-time checkbox. Done or not done.</p>

                  <div className="mt-4 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                      <span className="text-sm text-gray-500">Not done</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-500">Done</span>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Best for: </span>
                    <span className="text-gray-600 dark:text-gray-400">Brush teeth, Get dressed, Make bed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multiple Task */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔢</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Multiple Task</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Count from 0 to a target (max 9). Perfect for repeated actions.</p>

                  <div className="mt-4 flex items-center gap-3">
                    {[0, 1, 2, 3].map((num) => (
                      <div key={num} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                        num === 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {num}
                      </div>
                    ))}
                    <span className="text-gray-400">/</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                      5
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Best for: </span>
                    <span className="text-gray-600 dark:text-gray-400">Drink 5 glasses of water, Do 3 math problems, Practice piano 4 times</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Task */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Progress Task</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Track any numeric value toward a goal. Great for time or quantity tracking.</p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Reading</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">15 / 20 min</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Best for: </span>
                    <span className="text-gray-600 dark:text-gray-400">Read for 20 minutes, Practice spelling 30 words, Exercise for 15 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/guide/features/task-types" className="text-purple-600 dark:text-purple-400 hover:underline text-sm">
              Learn more about task types →
            </Link>
          </div>
        </div>
      </section>

      {/* Adding Tasks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Adding Tasks to a Routine</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">1</span>
                <span className="text-gray-700 dark:text-gray-300">Open the routine by clicking on it</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">2</span>
                <span className="text-gray-700 dark:text-gray-300">Click &quot;Add Task&quot; button</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">3</span>
                <span className="text-gray-700 dark:text-gray-300">Enter the task name</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">4</span>
                <span className="text-gray-700 dark:text-gray-300">Choose the task type (Simple, Multiple, or Progress)</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">5</span>
                <span className="text-gray-700 dark:text-gray-300">If Multiple or Progress, set the target value</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">6</span>
                <span className="text-gray-700 dark:text-gray-300">Save the task</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Reordering */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Reordering Tasks</h2>

        <div className="not-prose bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-4">
            <span className="text-2xl">↕️</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Drag and Drop</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tasks can be reordered by dragging them to a new position. The order you set is the order your child will see them in Kiosk Mode.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <strong>Tip:</strong> Order tasks in the sequence you want your child to complete them—this helps build a predictable flow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Tier Limits</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tier</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Routines per Child</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tasks per Routine</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Free</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">3</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">5</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Standard</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">10</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">20</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Premium</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Unlimited</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/parent/children" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Managing Children</span>
          </Link>
          <Link href="/guide/parent/kiosk" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Kiosk Mode</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

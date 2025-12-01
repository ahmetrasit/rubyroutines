import Link from 'next/link';

export default function ClassroomsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-blue-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/teacher" className="hover:text-blue-600">Teacher Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Classrooms</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-3xl">📚</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classrooms</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Create and manage your classroom spaces</p>
          </div>
        </div>
      </div>

      {/* What is a Classroom */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is a Classroom?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              A <strong>classroom</strong> is a group of students you manage together. It&apos;s your workspace within a school for tracking routines and progress.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl mb-2">📐</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Subject Classes</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3rd Grade Math, Science Lab</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl mb-2">📖</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Reading Groups</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Advanced Readers, Book Club</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl mb-2">🎨</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Special Groups</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Art Class, After School Program</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creating a Classroom */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Creating a Classroom</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open Teacher Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Make sure you&apos;re in Teacher Mode and have selected your school.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click &quot;Add Classroom&quot;</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find the + button or &quot;Add Classroom&quot; card on your dashboard.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enter Classroom Details</h3>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mt-3 border border-gray-200 dark:border-gray-600">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Classroom Name</label>
                        <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">3rd Grade - Room 204</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Icon</label>
                        <div className="flex gap-2">
                          {['📐', '📖', '🔬', '🎨', '🎵', '⚽'].map((emoji) => (
                            <div key={emoji} className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                              {emoji}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save and Add Students</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your classroom is created! Now add students to it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Classroom Fields */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Classroom Settings</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Setting</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Required</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Name</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Display name for the classroom</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Icon</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Emoji identifier for quick recognition</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">School</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Auto</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Automatically set based on your current school</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Managing Classrooms */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Managing Your Classrooms</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">✏️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Editing a Classroom</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Click on a classroom card, then use the Edit button to change its name or icon.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🗑️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Deleting a Classroom</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Remove a classroom from settings. Students and their data will also be removed.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assigning Routines</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Create classroom-specific routines or use school-wide routines set by your principal.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">👀</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Viewing Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See completion rates for all students in your classroom at a glance.
            </p>
          </div>
        </div>
      </section>

      {/* Routines in Classrooms */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Routines in Classrooms</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Classrooms can have two types of routines:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🏛️</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">School-Wide Routines</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Created by your principal and automatically applied to all classrooms.
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• You can see but not edit these</li>
                  <li>• Same for all teachers</li>
                  <li>• Example: &quot;Morning Check-In&quot;</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-cyan-200 dark:border-cyan-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">📚</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">Classroom Routines</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Created by you specifically for this classroom.
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• You create and manage these</li>
                  <li>• Only for your classroom</li>
                  <li>• Example: &quot;Math Class Prep&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Tier Limits</h2>

        <div className="not-prose">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-4">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Classroom Limits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  The number of classrooms you can create depends on your school&apos;s plan:
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-200">Free</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">3</div>
                    <div className="text-xs text-gray-500">classrooms</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">Standard</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">20</div>
                    <div className="text-xs text-gray-500">classrooms</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-300">Premium</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">∞</div>
                    <div className="text-xs text-gray-500">unlimited</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/teacher" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span>←</span>
            <span>Teacher Overview</span>
          </Link>
          <Link href="/guide/teacher/students" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <span>Students</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';

export default function StudentsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-blue-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/teacher" className="hover:text-blue-600">Teacher Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Students</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-3xl">👦</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Add and manage students in your classrooms</p>
          </div>
        </div>
      </div>

      {/* Adding Students */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Adding a Student</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Open a Classroom</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click on your classroom from the dashboard</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Click &quot;Add Student&quot;</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find the + button in the students section</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Enter Student Details</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Provide name and choose an avatar</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Save</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Student is added and ready to track</p>
                  </div>
                </div>
              </div>

              {/* Form Example */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add Student</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Student Name</label>
                    <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">Alex Johnson</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avatar</label>
                    <div className="flex gap-2 flex-wrap">
                      {['🦊', '🐼', '🦁', '🐸', '🦋', '🌟', '🚀', '🎨'].map((emoji) => (
                        <button
                          key={emoji}
                          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-lg hover:ring-2 ring-green-400"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-green-600 text-white rounded-lg py-2 font-medium">
                    Add Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Profile */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Student Profile Fields</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Field</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Required</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Name</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Student&apos;s display name</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Avatar</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Emoji for visual identification</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Parent Link</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Optional</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Connect to parent&apos;s Ruby Routines account</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Student List View */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Student List View</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">3rd Grade - Room 204</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">24 students</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-600">
              {[
                { name: 'Alex Johnson', avatar: '🦊', progress: 85 },
                { name: 'Emma Wilson', avatar: '🦋', progress: 92 },
                { name: 'Jake Martinez', avatar: '🚀', progress: 78 },
                { name: 'Sofia Chen', avatar: '🌟', progress: 88 },
              ].map((student) => (
                <div key={student.name} className="px-6 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xl">
                    {student.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Today&apos;s progress</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{student.progress}%</div>
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${student.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Managing Students */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Managing Students</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">✏️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Edit Student</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Click on a student to view their profile. Use the Edit button to change their name or avatar.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Move to Another Classroom</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transfer a student to a different classroom from their profile settings.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See a student&apos;s completion history and patterns over time.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🗑️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Remove Student</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Remove a student from your classroom. Their data will be deleted.
            </p>
          </div>
        </div>
      </section>

      {/* Student Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Student Limits</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Free Tier</h3>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-1">15</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">students per classroom</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-5 border-2 border-blue-300 dark:border-blue-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Standard</h3>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">40</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">students per classroom</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-5 border-2 border-amber-300 dark:border-amber-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium</h3>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-1">∞</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">unlimited students</p>
            </div>
          </div>
        </div>
      </section>

      {/* Linking to Parents */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Linking Students to Parents</h2>

        <div className="not-prose bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex gap-4">
            <span className="text-2xl">🤝</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Parent Connections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                You can connect a student to their parent&apos;s Ruby Routines account. This allows parents to see their child&apos;s school progress.
              </p>
              <Link href="/guide/teacher/parent-connections" className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
                Learn more about Parent Connections →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/teacher/classrooms" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span>←</span>
            <span>Classrooms</span>
          </Link>
          <Link href="/guide/teacher/bulk-checkin" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <span>Bulk Check-in</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';

export default function SchoolsGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-amber-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/principal" className="hover:text-amber-600">Principal Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Managing Schools</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <span className="text-3xl">🏫</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Managing Schools</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Create and configure your school settings</p>
          </div>
        </div>
      </div>

      {/* Creating a School */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Creating a School</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Click &quot;Create School&quot;</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From your dashboard, find the option to create a new school</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Enter School Details</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Provide the school name</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Save</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your school is created and you&apos;re the principal</p>
                  </div>
                </div>
              </div>

              {/* Form Example */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Create New School</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">School Name</label>
                    <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">Lincoln Elementary School</div>
                  </div>
                  <button className="w-full bg-amber-600 text-white rounded-lg py-2 font-medium">
                    Create School
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Settings */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">School Settings</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Setting</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">School Name</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Display name visible to all staff</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Principal Email</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Your account email (automatic)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Staff List</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Teachers and support staff in your school</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">School Routines</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Routines that apply to all classrooms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* School-Wide Routines */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">School-Wide Routines</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              School-wide routines are created by the principal and automatically appear in every classroom. Teachers can track these but cannot modify them.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Good for:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Morning attendance check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>End-of-day checkout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Weekly assembly preparation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Consistent behavior expectations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Example:</h3>
                <div className="space-y-2">
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌅</span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">Morning Check-In</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>✓ Attendance taken</div>
                      <div>✓ Homework collected</div>
                      <div>✓ Daily agenda shared</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editing School */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Editing Your School</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">✏️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Change School Name</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Update your school&apos;s display name from the settings page. This updates everywhere instantly.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Manage Routines</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Add, edit, or remove school-wide routines. Changes affect all classrooms.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">👥</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View All Staff</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See a complete list of teachers and support staff. Manage their access and roles.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">School Statistics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View aggregate data across all classrooms—completion rates, trends, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Deleting a School */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Deleting a School</h2>

        <div className="not-prose bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Warning: This action is permanent</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                Deleting a school will remove all classrooms, students, staff memberships, and completion data. This cannot be undone.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• All staff will lose access immediately</li>
                <li>• All classroom data will be deleted</li>
                <li>• Teachers&apos; personal accounts remain (they just lose school access)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">School Tier Limits</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 1 school</li>
                <li>• 3 teachers</li>
                <li>• 50 students total</li>
              </ul>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-5 border-2 border-amber-300 dark:border-amber-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Standard</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 1 school</li>
                <li>• 20 teachers</li>
                <li>• 500 students total</li>
              </ul>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-5 border-2 border-purple-300 dark:border-purple-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Multiple schools</li>
                <li>• Unlimited teachers</li>
                <li>• Unlimited students</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/principal" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
            <span>←</span>
            <span>Principal Overview</span>
          </Link>
          <Link href="/guide/principal/staff" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
            <span>Teachers & Staff</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

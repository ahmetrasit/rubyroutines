import Link from 'next/link';

export default function VisibilityGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Visibility Settings</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-3xl">👁️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Visibility Settings</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Control who sees what in Ruby Routines</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Understanding Visibility</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Ruby Routines uses visibility settings to control what data is shared between different users and modes. This ensures privacy while enabling collaboration.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Private</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only you can see</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔗</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Shared</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Visible to linked users</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏫</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">School-wide</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All school staff</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Mode Visibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Parent Mode Visibility</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👶</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Children & Routines</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  By default, your children and their routines are private to you.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>✓ Only you can see and edit</li>
                  <li>✓ Children access via Kiosk (no account needed)</li>
                  <li>✓ Can share with co-parent if linked</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🤝</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Co-Parent Sharing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  When you link with a co-parent, you choose which routines to share.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Shared Routine</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Both parents see it, completions sync, appears in merged kiosk</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Private Routine</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Only you see it, doesn&apos;t appear in merged kiosk</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Mode Visibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Teacher Mode Visibility</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📚</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Classrooms</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Classrooms you create are visible to:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>✓ You (full edit access)</li>
                  <li>✓ Your school&apos;s principal (view access)</li>
                  <li>✓ Support staff (view access)</li>
                  <li>✗ Other teachers cannot see your classrooms</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👨‍👩‍👧</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Parent Connections</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  When a student is linked to a parent:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>✓ Parent can view school routine progress</li>
                  <li>✓ Parent cannot edit school data</li>
                  <li>✗ You cannot see the parent&apos;s home routines</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principal Mode Visibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Principal Mode Visibility</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🏛️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">School-Wide Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  As principal, you have visibility across the entire school:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>✓ View all classrooms</li>
                  <li>✓ View all teachers&apos; student lists</li>
                  <li>✓ View aggregate progress data</li>
                  <li>✓ Create school-wide routines (visible to all)</li>
                  <li>✗ Cannot edit teacher&apos;s classroom routines</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Matrix */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Visibility Matrix</h2>

        <div className="not-prose">
          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 min-w-[600px]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Data</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Owner</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Co-Parent</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Teacher</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Principal</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Home routines</td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">✓ Edit</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">View*</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">School routines</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">View</td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">✓ Edit</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Classroom routines</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">✓ Edit</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">View</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Student progress (school)</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">View**</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">✓ Edit</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">View</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>* Only if routine is marked as shared</p>
            <p>** Only if student is linked to parent account</p>
          </div>
        </div>
      </section>

      {/* Privacy Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Privacy Best Practices</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>✓</span> Do
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li>• Review what you share before linking</li>
              <li>• Keep sensitive routines private</li>
              <li>• Use separate routines for different contexts</li>
              <li>• Regularly review your connections</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>✗</span> Avoid
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li>• Sharing codes with unintended recipients</li>
              <li>• Including sensitive info in task names</li>
              <li>• Assuming all data is shared (check settings)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/features/task-types" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Task Types</span>
          </Link>
          <Link href="/guide/features/smart-routines" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Smart Routines</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

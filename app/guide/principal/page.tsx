import Link from 'next/link';

export default function PrincipalGuideOverview() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Hero */}
      <div className="not-prose mb-12">
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🏛️</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Principal Mode Guide
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your school, teachers, and school-wide routines
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Flow Diagram */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How Principal Mode Works</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">🏫</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">1. Create School</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set up your school profile</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">👩‍🏫</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">2. Invite Teachers</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Send invitations to staff</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">3. Create Routines</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">School-wide routines for all</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">4. Monitor Progress</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overview of all classrooms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>

        <div className="not-prose grid md:grid-cols-2 gap-4">
          <Link href="/guide/principal/schools" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏫</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Managing Schools
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Create and configure your school settings
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/principal/staff" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👩‍🏫</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Teachers & Staff
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Invite and manage your teaching staff
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* School Hierarchy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Understanding the School Hierarchy</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="space-y-4">
              {/* Principal Level */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-amber-400 dark:border-amber-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Principal</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">School admin • Full control</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-0.5 h-6 bg-amber-300 dark:bg-amber-600"></div>
              </div>

              {/* Teachers Level */}
              <div className="ml-8 grid md:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👩‍🏫</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Teachers</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Manage own classrooms</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🧑‍💼</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Support Staff</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">View access only</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center ml-8">
                <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
              </div>

              {/* Classrooms Level */}
              <div className="ml-16 grid md:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">3rd Grade</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📐</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Math Lab</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Art Class</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Principal Dashboard</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-semibold">Principal Dashboard</span>
              <span className="bg-amber-700 px-3 py-1 rounded text-sm">Lincoln Elementary</span>
            </div>

            {/* Stats */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Teachers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Classrooms</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">450</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">87%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Completion</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-amber-300 dark:border-amber-700 text-center">
                  <span className="text-2xl">👩‍🏫</span>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Invite Teacher</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-green-300 dark:border-green-700 text-center">
                  <span className="text-2xl">📋</span>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Create Routine</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 text-center">
                  <span className="text-2xl">📊</span>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">View Reports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Principal Capabilities</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span> School-Wide Routines
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Create routines that automatically apply to all classrooms. Perfect for morning check-ins, school-wide expectations, and assembly days.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">👥</span> Staff Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Invite teachers and support staff via email. Manage roles and permissions. See who&apos;s active in the system.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📊</span> School Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See aggregate stats across all classrooms. Identify trends, spot issues, and celebrate successes at the school level.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">⚙️</span> School Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Configure school name, default routines, and visibility settings. Control what teachers can modify.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Getting Started Checklist</h2>

        <div className="not-prose bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-amber-400 dark:border-amber-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Create your school</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up your school name and basic info</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-amber-400 dark:border-amber-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Invite your first teacher</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Send an invitation email to a teacher</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-amber-400 dark:border-amber-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Create a school-wide routine</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up a routine all classrooms will use</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-amber-400 dark:border-amber-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Review your dashboard</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Explore the stats and monitoring features</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="not-prose">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Next Steps</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/guide/principal/schools" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">🏫</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Managing Schools</span>
            </Link>
            <Link href="/guide/principal/staff" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">👩‍🏫</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Teachers & Staff</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

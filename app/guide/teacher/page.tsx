import Link from 'next/link';

export default function TeacherGuideOverview() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Hero */}
      <div className="not-prose mb-12">
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🏫</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Teacher Mode Guide
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage classrooms, students, and routines for your school
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Flow Diagram */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How Teacher Mode Works</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">1. Join a School</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accept an invitation from your principal</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">2. Create Classrooms</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set up classes with routines</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">👦</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">3. Add Students</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enroll students in your classrooms</p>
              </div>

              <div className="hidden md:block text-gray-300 dark:text-gray-600 text-2xl">→</div>
              <div className="md:hidden text-gray-300 dark:text-gray-600 text-2xl">↓</div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">4. Track Progress</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use bulk check-in for the class</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>

        <div className="not-prose grid md:grid-cols-2 gap-4">
          <Link href="/guide/teacher/classrooms" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Classrooms
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Create and manage your classroom spaces
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/teacher/students" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    Students
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Add and manage students in your classrooms
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/teacher/bulk-checkin" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Bulk Check-in
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Efficiently track tasks for your whole class
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/guide/teacher/parent-connections" className="group">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Parent Connections
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Link students with their parents&apos; accounts
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Teacher vs Parent Mode */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Teacher Mode vs Parent Mode</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🏫</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">Teacher Mode</h3>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Manage multiple classrooms</li>
                  <li>• Bulk check-in for efficiency</li>
                  <li>• School-wide routines from principal</li>
                  <li>• Student-focused (not your own children)</li>
                  <li>• Connect with parents for visibility</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">Parent Mode</h3>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Manage your own children</li>
                  <li>• Kiosk mode for self-check-in</li>
                  <li>• Custom routines you create</li>
                  <li>• Family-focused</li>
                  <li>• Co-parent sharing</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>You can use both modes!</strong> Many teachers are also parents. Switch between modes using the mode selector in the header to manage your classroom and your family separately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Walkthrough */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Teacher Dashboard</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-semibold">Teacher Dashboard</span>
              <div className="flex gap-2">
                <span className="bg-blue-700 px-3 py-1 rounded text-sm">Lincoln Elementary</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Classroom Card Example */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-xl">
                      📐
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">3rd Grade Math</div>
                      <div className="text-xs text-gray-500">24 students</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ← Classroom card
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-green-300 dark:border-green-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-xl">
                      📖
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Reading Group A</div>
                      <div className="text-xs text-gray-500">8 students</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ← Click to see students
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">➕</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Add Classroom</div>
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
              <span className="text-xl">🏛️</span> Schools
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Schools are managed by principals who can invite you. Once invited:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• You see the school in your mode switcher</li>
              <li>• You can create classrooms within the school</li>
              <li>• You may inherit school-wide routines</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📚</span> Classrooms
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Classrooms are your workspace within a school:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Each classroom has its own students</li>
              <li>• Routines can be per-classroom or school-wide</li>
              <li>• You manage your own classrooms</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">👦</span> Students
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Students belong to classrooms:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Create student profiles with name & avatar</li>
              <li>• Optionally link to their parent&apos;s account</li>
              <li>• Track individual progress on routines</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">✅</span> Bulk Check-in
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              A special view for efficiently marking tasks:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• See all students in a grid</li>
              <li>• Click to toggle task completion</li>
              <li>• Mark multiple students at once</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Getting Started Checklist */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Getting Started Checklist</h2>

        <div className="not-prose bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Accept school invitation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your principal will send you an invitation email or code</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Create your first classroom</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up a classroom for your class or group</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Add students to your classroom</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create student profiles or import from a list</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Create or assign routines</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use school-wide routines or create classroom-specific ones</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Try bulk check-in</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mark task completions for your whole class at once</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="not-prose">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Next Steps</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/guide/teacher/classrooms" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">📚</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Classrooms</span>
            </Link>
            <Link href="/guide/teacher/students" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">👦</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add Students</span>
            </Link>
            <Link href="/guide/teacher/bulk-checkin" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">✅</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Bulk Check-in</span>
            </Link>
            <Link href="/guide/teacher/parent-connections" className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-2">🤝</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Connect Parents</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

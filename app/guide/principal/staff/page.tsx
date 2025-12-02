import Link from 'next/link';

export default function StaffGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-amber-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/principal" className="hover:text-amber-600">Principal Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Teachers & Staff</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-3xl">👩‍🏫</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teachers & Staff</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Invite and manage your teaching staff</p>
          </div>
        </div>
      </div>

      {/* Staff Roles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Staff Roles</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Principal */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border-2 border-amber-300 dark:border-amber-700">
              <div className="text-3xl mb-3">🏛️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Principal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Full administrative access
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>✓ Create/delete school</li>
                <li>✓ Invite/remove staff</li>
                <li>✓ Create school-wide routines</li>
                <li>✓ View all classrooms</li>
                <li>✓ Access all reports</li>
              </ul>
            </div>

            {/* Teacher */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-300 dark:border-blue-700">
              <div className="text-3xl mb-3">👩‍🏫</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Teacher</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Classroom management access
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>✓ Create own classrooms</li>
                <li>✓ Add students</li>
                <li>✓ Create classroom routines</li>
                <li>✓ Use bulk check-in</li>
                <li>✓ Connect with parents</li>
              </ul>
            </div>

            {/* Support Staff */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-2 border-green-300 dark:border-green-700">
              <div className="text-3xl mb-3">🧑‍💼</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Support Staff</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                View-only access
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>✓ View school overview</li>
                <li>✓ View classroom progress</li>
                <li>✗ Cannot create classrooms</li>
                <li>✗ Cannot modify data</li>
                <li>✗ Cannot invite others</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Inviting Staff */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Inviting Staff Members</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Go to Staff Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">From your Principal dashboard, click on &quot;Staff&quot; or &quot;Invite Teachers&quot;.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Choose Invitation Type</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👩‍🏫</span>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">Invite Teacher</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Can create classrooms and manage students</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🧑‍💼</span>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">Invite Support Staff</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">View-only access to school data</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enter Email Address</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Type the email of the person you want to invite.</p>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-sm">teacher@school.edu</div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Send Invite</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Invitation Sent</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The person will receive an email with a link to join your school. Once they accept, they&apos;ll appear in your staff list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff List View */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Staff List</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Lincoln Elementary Staff</span>
                <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">+ Invite</button>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-600">
              {[
                { name: 'You (Principal)', email: 'principal@school.edu', role: 'Principal', roleColor: 'amber', status: 'Active' },
                { name: 'Sarah Johnson', email: 'sjohnson@school.edu', role: 'Teacher', roleColor: 'blue', status: 'Active' },
                { name: 'Mike Chen', email: 'mchen@school.edu', role: 'Teacher', roleColor: 'blue', status: 'Active' },
                { name: 'Lisa Park', email: 'lpark@school.edu', role: 'Support', roleColor: 'green', status: 'Pending' },
              ].map((member) => (
                <div key={member.email} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg">
                    {member.role === 'Principal' ? '🏛️' : member.role === 'Teacher' ? '👩‍🏫' : '🧑‍💼'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded bg-${member.roleColor}-100 dark:bg-${member.roleColor}-900/30 text-${member.roleColor}-700 dark:text-${member.roleColor}-300`}>
                    {member.role}
                  </span>
                  <span className={`text-xs ${member.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Managing Staff */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Managing Staff</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📧</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resend Invitation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If a teacher didn&apos;t receive the email, you can resend the invitation from the staff list.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Change Role</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upgrade support staff to teacher role, or downgrade a teacher to support if needed.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">❌</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Remove Staff</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Remove a staff member from your school. Their personal account remains, they just lose school access.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Activity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See which teachers are actively using the system and how many classrooms they manage.
            </p>
          </div>
        </div>
      </section>

      {/* Invitation Status */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Invitation Statuses</h2>

        <div className="not-prose">
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Pending</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Invitation sent, waiting for the person to accept. Expires after 7 days.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Active</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Staff member accepted the invitation and has access to the school.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Expired</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Invitation expired without being accepted. You can resend it.</p>
                </div>
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
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I have multiple principals?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Currently, each school has one principal. If you need to transfer ownership, contact support.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens to classrooms when a teacher is removed?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Their classrooms remain in the school. You can assign them to another teacher or manage them yourself.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can teachers be in multiple schools?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes, a teacher can accept invitations from multiple schools. They&apos;ll switch between them using the mode selector.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/principal/schools" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
            <span>←</span>
            <span>Managing Schools</span>
          </Link>
          <Link href="/guide/features/task-types" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
            <span>Features Reference</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Hero Section */}
      <div className="not-prose mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Ruby Routines
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A calm, structured approach to building lasting routines and long-term discipline.
          </p>
        </div>

        {/* Philosophy Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="text-3xl mb-3">🧘</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              Calm by Design
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No streaks. No leaderboards. No dopamine manipulation. Just gentle reminders and structured support.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              Long-term Discipline
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Build neural pathways through consistent, pressure-free practice. Focus on the process, not the score.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="text-3xl mb-3">🌟</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              For Advanced Learners
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Designed with gifted and twice-exceptional children in mind. Respects autonomy while providing structure.
            </p>
          </div>
        </div>
      </div>

      {/* What Makes Us Different */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Makes Ruby Routines Different?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* What We Are */}
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">✓</span> What We Are
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>A reminder system</strong> - Helps children remember what to do next
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>A visual checklist</strong> - Clear, calm interface for self-check-in
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>A light goal setter</strong> - Gentle progress tracking without pressure
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>A structure builder</strong> - Consistent routines that become automatic
                    </span>
                  </li>
                </ul>
              </div>

              {/* What We're Not */}
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">✗</span> What We&apos;re Not
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Not a gamified habit app</strong> - No points, badges, or competitive elements
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Not streak-obsessed</strong> - Missing a day doesn&apos;t break anything
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Not attention-consuming</strong> - Quick check-in, then move on with life
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">●</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Not punishment-based</strong> - No shame, no guilt, no negative reinforcement
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Safety */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Privacy-First by Design</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Your Data, Your Control
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We believe privacy is a fundamental right, especially when it comes to children and families.
                  Ruby Routines is built with privacy at its core.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🚫</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">No Unnecessary Data Collection</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  We only collect what&apos;s essential to provide the service. No tracking pixels, no selling data,
                  no third-party analytics watching your family&apos;s routines.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🗑️</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Complete Data Deletion</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  When you delete your account or request data removal, we permanently delete everything.
                  No backups kept, no &quot;anonymized&quot; retention—truly gone.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">👨‍👩‍👧</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Adults-Only Accounts</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Only adults (parents, teachers, caregivers) create accounts. Children never need to sign up,
                  provide email addresses, or create passwords.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🛡️</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">No Social Features for Minors</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Children use Kiosk Mode—a simple checklist with no messaging, no profiles, no interaction
                  with strangers. Just their tasks, nothing else.
                </p>
              </div>
            </div>

            <div className="mt-6 bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">✓</span>
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>COPPA & GDPR Compliant:</strong> We follow strict guidelines for children&apos;s privacy.
                  Parental consent is required, and we never collect more than necessary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Who Uses Ruby Routines?</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          {/* Families with Children */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Families with Children</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Help kids build independence with morning routines, homework schedules, and bedtime rituals.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">•</span>
                <span>Morning routine (brush teeth, get dressed, pack bag)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">•</span>
                <span>Homework and reading time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">•</span>
                <span>Chores and responsibilities</span>
              </div>
            </div>
          </div>

          {/* Elder Care */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👴👵</span>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Elder Care & Caregivers</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Support aging parents or loved ones with gentle reminders for daily health routines.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-teal-500">•</span>
                <span>Medication schedules (morning, afternoon, evening pills)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-500">•</span>
                <span>Hydration tracking (glasses of water per day)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-500">•</span>
                <span>Meal reminders (breakfast, lunch, dinner)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-500">•</span>
                <span>Exercise and mobility activities</span>
              </div>
            </div>
          </div>

          {/* Schools */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏫</span>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Schools & Classrooms</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Teachers track classroom routines and help students build organizational skills.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Morning check-in and attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Classroom responsibilities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>End-of-day pack-up routine</span>
              </div>
            </div>
          </div>

          {/* Special Needs */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🧠</span>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Neurodivergent Support</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Visual structure helps those with ADHD, autism, or executive function challenges.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">•</span>
                <span>Visual task sequences reduce cognitive load</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500">•</span>
                <span>No time pressure or overwhelming notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500">•</span>
                <span>Consistent structure without rigidity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Start Guides</h2>

        <div className="not-prose grid md:grid-cols-3 gap-6">
          <Link href="/guide/parent" className="group">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Parent Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage your children&apos;s routines, set up kiosk for self-check-in, and track progress together.
              </p>
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                Get Started →
              </span>
            </div>
          </Link>

          <Link href="/guide/teacher" className="group">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
              <div className="text-4xl mb-4">🏫</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Teacher Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create classrooms, manage students, and use bulk check-in for efficient classroom management.
              </p>
              <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Get Started →
              </span>
            </div>
          </Link>

          <Link href="/guide/principal" className="group">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Principal Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage your school, invite teachers and support staff, and oversee all classrooms.
              </p>
              <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                Get Started →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* For Gifted Learners Callout */}
      <section className="not-prose">
        <Link href="/guide/for-gifted-learners">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white hover:from-purple-700 hover:to-blue-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Built for Gifted & 2e Learners
                </h2>
                <p className="text-purple-100 max-w-xl">
                  Learn how Ruby Routines addresses the unique executive function challenges
                  faced by gifted, twice-exceptional, and advanced learners.
                </p>
              </div>
              <div className="text-5xl">🧠</div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-medium">
                Learn More <span>→</span>
              </span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}

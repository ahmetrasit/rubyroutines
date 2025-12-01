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

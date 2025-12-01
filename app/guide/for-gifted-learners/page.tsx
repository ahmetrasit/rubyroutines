import Link from 'next/link';

export default function ForGiftedLearnersPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Hero */}
      <div className="not-prose mb-12">
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🧠</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                For Gifted & 2e Learners
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Understanding why Ruby Routines works for advanced minds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Understanding the Challenge */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Understanding the Challenge</h2>

        <p className="lead text-lg text-gray-600 dark:text-gray-300 mb-6">
          Gifted children and adults often face a paradox: brilliant minds that struggle with everyday routines.
          This isn&apos;t laziness or lack of motivation—it&apos;s a documented developmental pattern.
        </p>

        <div className="not-prose bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg mb-8">
          <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">
            The Prefrontal Cortex Delay
          </h3>
          <p className="text-amber-700 dark:text-amber-200 text-sm">
            Research from the Davidson Institute shows that profoundly gifted children may experience a
            <strong> 3-4 year delay</strong> in prefrontal cortex development. While neurotypical children
            begin neural pathway pruning around age 8-9, gifted children&apos;s brains may continue in an
            extended &quot;sponge phase&quot; until age 12-13. This means executive function skills—planning,
            organizing, task initiation—may lag significantly behind intellectual abilities.
          </p>
        </div>

        {/* The Asynchrony Diagram */}
        <div className="not-prose mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Asynchronous Development in Gifted Learners
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Intellect</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full relative">
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                    Age 16+
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Verbal Skills</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative" style={{width: '85%'}}>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                    Age 14
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Executive Function</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full relative" style={{width: '50%'}}>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                    Age 8
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Emotional Age</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full relative" style={{width: '60%'}}>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                    Age 10
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Example: A 10-year-old gifted child may think like a 16-year-old but organize like an 8-year-old
            </p>
          </div>
        </div>
      </section>

      {/* Common Struggles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Common Struggles We Address</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-xl">😰</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Perfectionism & Fear of Failure</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Up to 88% of academically gifted students identify as perfectionists. Fear of failure can
              cause task avoidance and procrastination.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>How Ruby Routines helps:</strong> No punishment for missed tasks. No streaks to break.
                Each day is a fresh start.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-xl">🔄</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Task Switching Difficulty</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Gifted children often have advanced working memory but underdeveloped ability to switch
              attention between tasks.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>How Ruby Routines helps:</strong> Visual checklists show exactly what comes next,
                reducing cognitive load during transitions.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">The &quot;Too Easy&quot; Problem</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              When school is easy, gifted children never need to develop study skills or organizational
              systems—until they suddenly do.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>How Ruby Routines helps:</strong> Builds organizational habits before they&apos;re
                critically needed. Practice makes neural pathways permanent.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Emotional Flooding</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              The frustration of not being able to perform simple tasks easily can trigger emotions
              that become unmanageable.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>How Ruby Routines helps:</strong> Low-pressure, non-judgmental interface.
                No negative feedback or shame-inducing elements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Traditional Apps Fail */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Traditional Habit Apps Fail Gifted Minds</h2>

        <div className="not-prose">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4">
              The Dopamine Trap
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 mb-4">
              Most habit tracking apps use gamification tactics—points, badges, streaks, leaderboards—that
              create dopamine spikes. Research shows this approach fails 92% of users within 60 days because:
            </p>
            <ul className="space-y-2 text-sm text-red-700 dark:text-red-200">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>The brain downregulates dopamine receptors, requiring more stimulation for the same effect</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Missing a streak creates disproportionate negative emotional response</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>The habit becomes about the app, not the behavior</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Gifted individuals often see through the manipulation, reducing engagement</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4">
              The Ruby Routines Approach
            </h3>
            <p className="text-sm text-green-700 dark:text-green-200 mb-4">
              We take a fundamentally different approach based on neuroscience and the specific needs
              of advanced learners:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Intrinsic Motivation</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  No external rewards. The satisfaction comes from completing real tasks,
                  not collecting virtual badges.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Autonomy Support</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Research shows gifted learners thrive with choice. Customize routines,
                  visibility, and structure to individual needs.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">No Punishment Mechanics</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Breaking a streak in other apps feels like failure. Here, every day
                  is simply a new opportunity.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick In, Quick Out</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Check-in takes seconds. The app doesn&apos;t demand attention or create
                  new distractions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Mapping */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Features Designed for Gifted Learners</h2>

        <div className="not-prose space-y-4">
          {[
            {
              feature: 'Visual Checklists & Kiosk Mode',
              need: 'Need for external executive function support',
              research: 'Research recommends laminated schedules and visual supports for children with EF challenges',
              howWeHelp: 'Kiosk mode provides a dedicated, distraction-free checklist that children can use independently'
            },
            {
              feature: 'Flexible Reset Periods',
              need: 'Routine without rigidity',
              research: '2e children need predictability but also flexibility for creative expression',
              howWeHelp: 'Daily, weekly, or custom reset periods. Routines can be visible only on specific days'
            },
            {
              feature: 'Smart Routines (Conditional Visibility)',
              need: 'Adaptive structure that responds to context',
              research: 'Gifted learners benefit from personalization that respects their uniqueness',
              howWeHelp: 'Routines can appear/hide based on time, day, or goal progress—no irrelevant tasks cluttering the view'
            },
            {
              feature: 'Multiple Task Types',
              need: 'Different tracking needs for different activities',
              research: 'Breaking down activities into smaller steps prevents overwhelm',
              howWeHelp: 'Simple checkboxes, multiple check-ins (up to 9), and progress tracking (numeric values)'
            },
            {
              feature: 'No Streak Pressure',
              need: 'Reduction of perfectionism triggers',
              research: '20% of gifted children suffer from perfectionism severe enough to cause problems',
              howWeHelp: 'No visible streaks. No "you broke your streak" messages. Each period stands alone'
            },
            {
              feature: 'Gentle Goals',
              need: 'Achievement tracking without anxiety',
              research: 'Goals motivated by fear of failure rather than need for achievement are harmful',
              howWeHelp: 'Optional goal setting with simple completion counts. No leaderboards or comparisons'
            },
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.feature}</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Need</span>
                      <p className="text-gray-600 dark:text-gray-300">{item.need}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Research</span>
                      <p className="text-gray-600 dark:text-gray-300">{item.research}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Our Solution</span>
                      <p className="text-gray-600 dark:text-gray-300">{item.howWeHelp}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gap Analysis */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Future Roadmap: Addressing More Needs</h2>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Based on research into gifted learner needs, here are features we plan to implement:
        </p>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Planned Enhancements</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Timer Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Research suggests time-boxing helps with focus. We&apos;ll add optional timers for tasks
                    with breaks built in (Pomodoro-style but not prescriptive).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Transition Warnings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Advance notice before routine/task changes to help with task-switching challenges.
                    &quot;5 minutes until homework time.&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Emotion Check-ins</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Optional emotional regulation support—simple mood tracking that helps identify patterns
                    without being intrusive.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-xs">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Text-to-Speech / Speech-to-Text</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    For 2e children with dyslexia or dysgraphia—voice-based task completion and
                    audio routine announcements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-xs">5</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Interest-Based Routine Suggestions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Leverage strengths by suggesting routine structures based on the child&apos;s interests.
                    Strength-based approaches improve engagement in 2e children.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Sources */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Research Sources</h2>
        <div className="not-prose text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            • <a href="https://www.davidsongifted.org/gifted-blog/executive-functioning-and-gifted-children/"
               className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Davidson Institute: Executive Functioning and Gifted Children
            </a>
          </p>
          <p>
            • <a href="https://www.2eminds.com/executive-function-deficits/"
               className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
              2e Minds: How to Help Children with Executive Function Deficits
            </a>
          </p>
          <p>
            • <a href="https://raisinglifelonglearners.com/managing-perfectionism/"
               className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Raising Lifelong Learners: Managing Perfectionism in Gifted Children
            </a>
          </p>
          <p>
            • <a href="https://www.psychologytoday.com/us/blog/creative-synthesis/201802/tips-gifted-adults-adhd"
               className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Psychology Today: Tips for Gifted Adults with ADHD
            </a>
          </p>
          <p>
            • <a href="https://getgoally.com/blog/twice-exceptional-students/"
               className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Goally: Twice Exceptional Students
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="not-prose">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 text-center">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Choose your mode and follow our step-by-step guide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/guide/parent"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Parent Guide →
            </Link>
            <Link href="/guide/teacher"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Teacher Guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

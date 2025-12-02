import Link from 'next/link';

export default function SmartRoutinesGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Smart Routines</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">🧠</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Routines</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered routine suggestions and optimization</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <section className="mb-12">
        <div className="not-prose">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-8 border border-purple-200 dark:border-purple-800 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Smart Routines is an upcoming feature that will use AI to help you create and optimize routines for your children or students.
            </p>
          </div>
        </div>
      </section>

      {/* Planned Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Planned Features</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">💡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Routine Suggestions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get AI-powered suggestions for routines based on your child&apos;s age, interests, and goals. Start with pre-built templates and customize.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pattern Recognition</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Identify which tasks are completed consistently and which ones need adjustment. Get insights on optimal routine structure.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">⏰</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Time Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Suggestions for task ordering and timing based on completion patterns. Learn when your child is most productive.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Goal Recommendations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Intelligent goal suggestions based on current progress. Adjust targets to challenge without overwhelming.
            </p>
          </div>
        </div>
      </section>

      {/* Current Alternatives */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What You Can Do Now</h2>

        <div className="not-prose">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              While Smart Routines is in development, here are ways to create effective routines:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Browse the Marketplace</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Find pre-made routines created by other parents and educators. <Link href="/guide/features/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline">Learn more →</Link></p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Start Simple</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Begin with 3-5 tasks and add more as your child gets comfortable. Less is more when building habits.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Review Weekly</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Look at which tasks are completed consistently. Remove or adjust ones that aren&apos;t working.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Involve Your Child</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ask what tasks they think should be included. Children are more likely to follow routines they helped create.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stay Updated */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Stay Updated</h2>

        <div className="not-prose bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <span className="text-2xl">📬</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get Notified</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Smart Routines is actively being developed. We&apos;ll notify you when it&apos;s ready. Make sure your notification preferences are set in your account settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/features/visibility" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Visibility Settings</span>
          </Link>
          <Link href="/guide/features/marketplace" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Marketplace</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

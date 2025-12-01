import Link from 'next/link';

export default function MarketplaceGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Routine Community</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <span className="text-3xl">🤝</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Routine Community</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Discover, share, and learn from others&apos; routines</p>
          </div>
        </div>
      </div>

      {/* What is Routine Community */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is the Routine Community?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              The Routine Community is a free, community-driven library of routine templates. Browse routines created by other parents, educators, caregivers, and child development experts—then import them into your own account. Share your successful routines to help others, and benefit from the collective wisdom of families worldwide.
            </p>

            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-lg">✨</span>
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>100% Free:</strong> No premium tiers, no paywalls. Everyone can browse, import, and share routines at absolutely no cost.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📥</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Import</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add templates to your account</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">✏️</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Customize</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Modify to fit your needs</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📤</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Share</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Publish your own routines</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browsing Templates */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browsing Templates</h2>

        <div className="not-prose">
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Mock Header */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900 dark:text-white">Routine Community</span>
                <div className="flex-1">
                  <div className="bg-gray-200 dark:bg-gray-600 rounded px-3 py-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Search routines...
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex gap-2 overflow-x-auto">
                {['All', 'Morning', 'Bedtime', 'Homework', 'Chores', 'Health', 'School'].map((cat, i) => (
                  <span
                    key={cat}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      i === 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Template Cards */}
            <div className="p-6 grid md:grid-cols-2 gap-4">
              {[
                { icon: '🌅', name: 'Morning Power Start', author: 'Sarah M.', downloads: 1234, tasks: 6 },
                { icon: '📚', name: 'Homework Focus Time', author: 'Teacher Lisa', downloads: 892, tasks: 5 },
                { icon: '🌙', name: 'Calm Bedtime Routine', author: 'Dr. Sleep', downloads: 2341, tasks: 7 },
                { icon: '🧹', name: 'Weekend Chores', author: 'Organized Mom', downloads: 567, tasks: 8 },
              ].map((template) => (
                <div key={template.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-2xl">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">by {template.author}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{template.tasks} tasks</span>
                        <span>•</span>
                        <span>{template.downloads.toLocaleString()} imports</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Importing a Template */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Importing a Template</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Browse and Select</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find a template that matches your needs. Click to view details.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Preview Tasks</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">See all tasks included in the routine before importing.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Click &quot;Import&quot;</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose which child to assign the routine to.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Customize</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">The routine is now yours! Edit tasks, change targets, or remove items as needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sharing Your Routines */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Sharing Your Routines</h2>

        <div className="not-prose">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How to Share</h3>
                <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>1. Open a routine you want to share</li>
                  <li>2. Click &quot;Share to Marketplace&quot;</li>
                  <li>3. Add a description and category</li>
                  <li>4. Submit for review</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What Gets Shared</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>✓ Routine structure and tasks</li>
                  <li>✓ Task types and targets</li>
                  <li>✓ Reset period settings</li>
                  <li>✗ Your child&apos;s name (never shared)</li>
                  <li>✗ Completion history (never shared)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Marketplace Guidelines</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>✓</span> Quality Routines
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Well-structured routines with clear, actionable tasks. Avoid vague or overly complex templates.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>✓</span> Age-Appropriate
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Include age recommendations so parents can find suitable routines for their children.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>✓</span> Respectful Content
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              All content is reviewed before publishing. Keep task names and descriptions family-friendly.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/features/smart-routines" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Smart Routines</span>
          </Link>
          <Link href="/guide/features/limits" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Tier Limits</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

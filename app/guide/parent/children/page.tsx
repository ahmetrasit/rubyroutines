import Link from 'next/link';

export default function ChildrenGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/parent" className="hover:text-purple-600">Parent Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Managing Children</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">👶</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Managing Children</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Add, edit, and organize your children&apos;s profiles</p>
          </div>
        </div>
      </div>

      {/* Adding a Child */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Adding a Child</h2>

        <div className="not-prose">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Step by Step:</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Go to Parent Dashboard</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Make sure you&apos;re in Parent Mode (check the mode switcher in the header)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Click &quot;Add Child&quot;</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Find the + button or &quot;Add Child&quot; card on your dashboard</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Enter Details</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Provide name and choose an avatar (emoji)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Save</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click Save and your child&apos;s profile is ready</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Example */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">What You&apos;ll See:</h3>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Child&apos;s Name</label>
                    <div className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-2 text-gray-500 dark:text-gray-400">
                      Emma
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Choose Avatar</label>
                    <div className="flex gap-2 flex-wrap">
                      {['🦄', '🚀', '🌟', '🦊', '🐼', '🦋', '🌈', '⚽'].map((emoji) => (
                        <button
                          key={emoji}
                          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xl hover:ring-2 ring-purple-400"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium">
                    Save Child
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Child Profile Fields */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Child Profile Fields</h2>

        <div className="not-prose">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Field</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Required</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Name</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">The child&apos;s display name (1-50 characters)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Avatar</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">Yes</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">An emoji that represents the child (shown in kiosk and dashboard)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Editing a Child */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Editing a Child</h2>

        <div className="not-prose bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Edit</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>Click on a child&apos;s card to open their detail view</li>
                <li>Look for the &quot;Edit&quot; button (pencil icon) in the header</li>
                <li>Update name or avatar as needed</li>
                <li>Click Save to confirm changes</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Tier Limits</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Free Tier</h3>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-1">2</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">children maximum</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-5 border-2 border-purple-300 dark:border-purple-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Standard</h3>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">10</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">children maximum</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-5 border-2 border-amber-300 dark:border-amber-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium</h3>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-1">∞</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">unlimited children</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deleting a Child */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Deleting a Child</h2>

        <div className="not-prose bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Warning: This action is permanent</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                Deleting a child will also delete all their routines, tasks, and completion history. This cannot be undone.
              </p>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">To delete:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Open the child&apos;s edit view</li>
                <li>Scroll to the bottom</li>
                <li>Click &quot;Delete Child&quot;</li>
                <li>Confirm the deletion when prompted</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can my child have their own login?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Children don&apos;t need their own accounts. They access their routines through Kiosk Mode, which provides a simple, child-friendly interface without requiring login credentials.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can two parents manage the same child?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes! Use the <Link href="/guide/parent/coparent" className="text-purple-600 dark:text-purple-400 hover:underline">Co-Parent Sharing</Link> feature to link accounts and share routines between parents.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens if I reach my child limit?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You&apos;ll see a message prompting you to upgrade your plan. You can view pricing and upgrade options in your account settings.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/parent" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Parent Overview</span>
          </Link>
          <Link href="/guide/parent/routines" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Routines & Tasks</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

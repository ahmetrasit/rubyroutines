import Link from 'next/link';

export default function KioskGuidePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <div className="not-prose mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/guide" className="hover:text-purple-600">Guide</Link>
          <span>/</span>
          <Link href="/guide/parent" className="hover:text-purple-600">Parent Mode</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Kiosk Mode</span>
        </div>
      </div>

      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <span className="text-3xl">📱</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kiosk Mode</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">A self-service interface for children to check off their tasks</p>
          </div>
        </div>
      </div>

      {/* What is Kiosk Mode */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What is Kiosk Mode?</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Kiosk Mode is a <strong>child-friendly interface</strong> that runs on a tablet, phone, or computer. Children can see their routines and check off tasks themselves—no login required.
                </p>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Key Benefits:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Independence:</strong> Children manage their own progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>No login needed:</strong> Works with a simple code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Distraction-free:</strong> Clean interface with only tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Long sessions:</strong> Stays active for 90 days</span>
                  </li>
                </ul>
              </div>

              {/* Visual Mock */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                <div className="bg-amber-500 text-white px-4 py-3 rounded-t-lg -mt-4 -mx-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦄</span>
                    <span className="font-medium">Emma&apos;s Routines</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 line-through">Brush teeth</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 line-through">Get dressed</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Eat breakfast</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pack backpack</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Start Kiosk Mode */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How to Start Kiosk Mode</h2>

        <div className="not-prose">
          {/* Visual Flow */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generate a Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From your dashboard, click &quot;Kiosk&quot; and select the child. A 6-digit code appears.
                </p>
                <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg p-3 inline-block">
                  <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-wider">847293</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <span className="text-4xl text-gray-300 dark:text-gray-600">→</span>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enter on Child&apos;s Device</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  On a tablet or phone, go to the kiosk URL and enter the code.
                </p>
                <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">yoursite.com/kiosk</div>
                  <div className="flex gap-1 justify-center">
                    {[8, 4, 7, 2, 9, 3].map((digit, i) => (
                      <div key={i} className="w-8 h-10 border-2 border-gray-300 dark:border-gray-500 rounded flex items-center justify-center font-mono">
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Session Active!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                The child&apos;s kiosk is now active for <strong>90 days</strong>. They can tap tasks to mark them complete. No need to re-enter the code unless the session expires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Details */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">About Kiosk Codes</h2>

        <div className="not-prose">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">⏱️</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Code Validity</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Codes are valid for <strong>10 minutes</strong></li>
                <li>• If expired, generate a new one</li>
                <li>• Each code can only be used once</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📅</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Session Duration</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Sessions last <strong>90 days</strong></li>
                <li>• Device remembers the session</li>
                <li>• After 90 days, generate a new code</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">🔒</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Codes are random and secure</li>
                <li>• Only you can generate codes</li>
                <li>• Revoke sessions anytime</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📱</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Device Flexibility</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Works on any device with a browser</li>
                <li>• Tablets, phones, computers</li>
                <li>• Multiple devices per child allowed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Child View Infographic */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Children See</h2>

        <div className="not-prose">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Routine Selector */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">1. Choose a Routine</h3>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-2 border-purple-400 dark:border-purple-600">
                    <span className="text-2xl">🌅</span>
                    <span className="font-medium text-gray-900 dark:text-white">Morning Routine</span>
                    <span className="ml-auto text-sm text-purple-600 dark:text-purple-400">4/6</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span className="text-2xl">📚</span>
                    <span className="font-medium text-gray-900 dark:text-white">Homework</span>
                    <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">0/4</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span className="text-2xl">🌙</span>
                    <span className="font-medium text-gray-900 dark:text-white">Bedtime</span>
                    <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">0/5</span>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">2. Complete Tasks</h3>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 line-through">Wake up</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 line-through">Brush teeth</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-600">
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center">
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Get dressed</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 ml-auto">← Tap to complete</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Eat breakfast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Managing Sessions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Managing Kiosk Sessions</h2>

        <div className="not-prose space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔄</span> Revoking a Session
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If a device is lost or you want to end a session early, you can revoke it from your dashboard. Go to the child&apos;s settings and click &quot;Revoke Kiosk Sessions.&quot;
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>📱</span> Multiple Devices
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Each code creates a separate session. A child can have active kiosk sessions on multiple devices—useful if they use a tablet at home and a different one at a co-parent&apos;s house.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🤝</span> Co-Parent Merged Kiosk
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If you&apos;ve set up <Link href="/guide/parent/coparent" className="text-purple-600 dark:text-purple-400 hover:underline">co-parent sharing</Link>, the child&apos;s kiosk will show routines from both parents merged together.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Practices</h2>

        <div className="not-prose bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>✓</span> Do
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Place the tablet in a consistent location</li>
                <li>• Use a tablet stand for easy access</li>
                <li>• Let children complete tasks on their own</li>
                <li>• Celebrate completion without pressure</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>✗</span> Avoid
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Standing over the child while they check off</li>
                <li>• Using kiosk as punishment or reward leverage</li>
                <li>• Checking the app constantly for updates</li>
                <li>• Making a big deal of incomplete tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="not-prose">
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guide/parent/routines" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <span>←</span>
            <span>Routines & Tasks</span>
          </Link>
          <Link href="/guide/parent/coparent" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <span>Co-Parent Sharing</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

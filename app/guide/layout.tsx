import Link from 'next/link';
import { HomeButton } from '@/components/home-button';

const navigation = [
  {
    title: 'Getting Started',
    links: [
      { href: '/guide', label: 'Welcome' },
      { href: '/guide/for-gifted-learners', label: 'For Gifted Learners' },
    ],
  },
  {
    title: 'Parent Mode',
    links: [
      { href: '/guide/parent', label: 'Overview' },
      { href: '/guide/parent/children', label: 'Managing Children' },
      { href: '/guide/parent/routines', label: 'Routines & Tasks' },
      { href: '/guide/parent/kiosk', label: 'Kiosk Mode' },
      { href: '/guide/parent/coparent', label: 'Co-Parent Sharing' },
      { href: '/guide/parent/goals', label: 'Goals' },
    ],
  },
  {
    title: 'Teacher Mode',
    links: [
      { href: '/guide/teacher', label: 'Overview' },
      { href: '/guide/teacher/classrooms', label: 'Classrooms' },
      { href: '/guide/teacher/students', label: 'Students' },
      { href: '/guide/teacher/bulk-checkin', label: 'Bulk Check-in' },
      { href: '/guide/teacher/parent-connections', label: 'Parent Connections' },
    ],
  },
  {
    title: 'Principal Mode',
    links: [
      { href: '/guide/principal', label: 'Overview' },
      { href: '/guide/principal/schools', label: 'Managing Schools' },
      { href: '/guide/principal/staff', label: 'Teachers & Staff' },
    ],
  },
  {
    title: 'Features Reference',
    links: [
      { href: '/guide/features/task-types', label: 'Task Types' },
      { href: '/guide/features/visibility', label: 'Visibility Settings' },
      { href: '/guide/features/smart-routines', label: 'Smart Routines' },
      { href: '/guide/features/marketplace', label: 'Marketplace' },
      { href: '/guide/features/limits', label: 'Tier Limits' },
    ],
  },
];

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <HomeButton />
              <Link href="/guide" className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  Ruby Routines Guide
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/guide/parent"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300"
              >
                Parent Mode
              </Link>
              <Link
                href="/guide/teacher"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300"
              >
                Teacher Mode
              </Link>
              <Link
                href="/guide/principal"
                className="text-sm font-medium text-gray-600 hover:text-amber-600 dark:text-gray-300"
              >
                Principal Mode
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Ruby Routines - Building long-term discipline, one routine at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}

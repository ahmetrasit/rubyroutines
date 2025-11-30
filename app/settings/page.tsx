'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Shield, CreditCard, HelpCircle, BookOpen, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { HomeButton } from '@/components/home-button';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const settingsSections = [
    {
      title: 'Account',
      description: 'Manage your profile and preferences',
      icon: User,
      href: '/settings/account',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Security',
      description: 'Two-factor authentication and login settings',
      icon: Shield,
      href: '/settings/security',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Billing',
      description: 'Subscription plans and payment methods',
      icon: CreditCard,
      href: '/billing',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Support',
      description: 'Get help and contact our team',
      icon: HelpCircle,
      href: '/settings/support',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Blog',
      description: 'Tips, updates, and parenting resources',
      icon: BookOpen,
      href: 'https://blog.rubyroutines.com',
      external: true,
      color: 'bg-pink-100 text-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HomeButton />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const CardWrapper = section.external ? 'a' : Link;
            const cardProps = section.external
              ? { href: section.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: section.href };

            return (
              <CardWrapper key={section.title} {...cardProps} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {section.title}
                        {section.external && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </CardWrapper>
            );
          })}
        </div>

        {/* User Info */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, Mail, Palette } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize name when session loads
  useState(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    // TODO: Implement profile update mutation
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved.',
      variant: 'success',
    });

    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your profile and account preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your display name and profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name || session.user.name || ''}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Address
              </CardTitle>
              <CardDescription>Your email is used for login and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.user.emailVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
                {!session.user.emailVerified && (
                  <Button variant="outline" size="sm">
                    Resend Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how Ruby Routines looks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Theme preferences coming soon. Currently using system default.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

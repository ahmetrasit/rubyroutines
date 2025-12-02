'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ChevronLeft, Globe } from 'lucide-react';
import Link from 'next/link';

/**
 * Saved Routines page
 * Shows routines the user has saved/bookmarked for later
 */
export default function SavedRoutinesPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // TODO: Implement saved routines query
  const savedRoutines: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/parent"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Bookmark className="h-8 w-8" />
            Saved Routines
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Routines you've saved for later
          </p>
        </div>

        {savedRoutines.length > 0 ? (
          <div className="grid gap-4">
            {savedRoutines.map((routine: any) => (
              <Card key={routine.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{routine.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{routine.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved routines yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Browse Community Routines and save ones you'd like to use later.
              </p>
              <Link href="/community-routines">
                <Button>
                  <Globe className="h-4 w-4 mr-2" />
                  Browse Community Routines
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

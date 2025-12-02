'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateSchoolPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');

  const { data: session } = trpc.auth.getSession.useQuery();
  const utils = trpc.useUtils();

  // Get the user's parent role (needed for school creation)
  const user = session?.user as any;
  const parentRole = user?.roles?.find((r: any) => r.type === 'PARENT');

  const createSchoolMutation = trpc.school.create.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
      router.push('/principal');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('School name is required');
      return;
    }

    if (!parentRole?.id) {
      setError('You need a parent role to create a school');
      return;
    }

    createSchoolMutation.mutate({
      roleId: parentRole.id,
      name: name.trim(),
      address: address.trim() || undefined,
      website: website.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/principal">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Create Your School</CardTitle>
                <CardDescription>
                  Set up your school to manage teachers, staff, and classrooms
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lincoln Elementary School"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createSchoolMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={createSchoolMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://school.edu"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={createSchoolMutation.isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createSchoolMutation.isPending}
                  className="flex-1"
                >
                  {createSchoolMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create School'
                  )}
                </Button>
                <Link href="/principal">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

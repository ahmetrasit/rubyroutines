'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SchoolSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params?.schoolId as string;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: session } = trpc.auth.getSession.useQuery();
  const utils = trpc.useUtils();

  // Get school membership for this school
  const user = session?.user as any;
  const membership = user?.schoolMemberships?.find(
    (m: any) => m.schoolId === schoolId && m.role === 'PRINCIPAL'
  );

  // Initialize form with school data
  useEffect(() => {
    if (membership?.school) {
      setName(membership.school.name || '');
      setAddress(membership.school.address || '');
      setWebsite(membership.school.website || '');
    }
  }, [membership]);

  const updateSchoolMutation = trpc.school.update.useMutation({
    onSuccess: () => {
      setSuccess('School settings updated');
      utils.auth.getSession.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('School name is required');
      return;
    }

    if (!membership?.roleId) {
      setError('You do not have permission to update this school');
      return;
    }

    updateSchoolMutation.mutate({
      roleId: membership.roleId,
      schoolId,
      name: name.trim(),
      address: address.trim() || undefined,
      website: website.trim() || undefined,
    });
  };

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have principal access to this school.
            </p>
            <Link href="/principal">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/principal">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>School Settings</CardTitle>
                <CardDescription>
                  Manage your school&apos;s information
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
                  disabled={updateSchoolMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={updateSchoolMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://school.edu"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={updateSchoolMutation.isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={updateSchoolMutation.isPending}>
                {updateSchoolMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete School
              </Button>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  Are you sure? This will permanently delete the school and remove all
                  teacher and staff associations. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement delete school mutation
                      alert('Delete functionality coming soon');
                    }}
                  >
                    Yes, Delete School
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

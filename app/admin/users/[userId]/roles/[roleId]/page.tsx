'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { Tier } from '@/lib/types/prisma-enums';

export default function ManageRoleTierPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <ManageRoleTierContent />
    </AdminGuard>
  );
}

function ManageRoleTierContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Handle both string and array params from Next.js dynamic routes
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const roleId = Array.isArray(params.roleId) ? params.roleId[0] : params.roleId;

  const [selectedTier, setSelectedTier] = useState<Tier | ''>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Only run query if we have a valid userId
  const { data: userDetails, isLoading, error } = trpc.adminUsers.details.useQuery(
    { userId: userId || '' },
    {
      enabled: !!userId && typeof userId === 'string' && userId.length > 0,
      retry: false,
    }
  );

  const changeTierMutation = trpc.adminUsers.changeTier.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tier updated successfully',
      });
      if (userId) {
        utils.adminUsers.details.invalidate({ userId });
      }
      utils.adminUsers.search.invalidate();
      utils.adminUsers.statistics.invalidate();
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Find the specific role
  const role = userDetails?.roles.find((r: any) => r.id === roleId);

  // Set initial tier when role is loaded
  useEffect(() => {
    if (role && !selectedTier) {
      setSelectedTier(role.tier as Tier);
    }
  }, [role, selectedTier]);

  const handleTierChange = (newTier: string) => {
    setSelectedTier(newTier as Tier);
    setHasChanges(newTier !== role?.tier);
  };

  const handleSave = () => {
    if (!selectedTier) {
      toast({
        title: 'Error',
        description: 'Please select a tier',
        variant: 'destructive',
      });
      return;
    }

    if (!roleId || typeof roleId !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid role ID',
        variant: 'destructive',
      });
      return;
    }

    changeTierMutation.mutate({
      roleId: roleId,
      tier: selectedTier as Tier,
    });
  };

  const handleCancel = () => {
    if (role) {
      setSelectedTier(role.tier as Tier);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Show error if query failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading User</h2>
              <p className="text-muted-foreground mb-2">
                {error.message || 'Failed to load user details'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                User ID: {userId || 'undefined'}
              </p>
              <Link href="/admin/users">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userDetails || !role) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Role Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested role could not be found.
              </p>
              <Link href="/admin/users">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Manage Role Tier</h1>
          <p className="text-muted-foreground">
            Update tier settings for {userDetails.email}&apos;s {role.type.toLowerCase()} role
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Email</div>
                <div className="font-medium">{userDetails.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Role Type</div>
                <div className="font-medium">{role.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Admin Status</div>
                <div>
                  {userDetails.isAdmin ? (
                    <Badge variant="destructive">Administrator</Badge>
                  ) : (
                    <Badge variant="outline">Regular User</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Roles</div>
                <div className="font-medium">{userDetails.roles.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Management Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tier Settings</CardTitle>
            <CardDescription>
              Change the tier for this role to adjust available limits and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Tier</label>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {role.tier}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">New Tier</label>
                <Select value={selectedTier} onValueChange={handleTierChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Tier.FREE}>Free</SelectItem>
                    <SelectItem value={Tier.BRONZE}>Bronze</SelectItem>
                    <SelectItem value={Tier.GOLD}>Gold</SelectItem>
                    <SelectItem value={Tier.PRO}>Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasChanges && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 mb-1">Unsaved Changes</div>
                      <div className="text-sm text-blue-700">
                        You have changed the tier from <strong>{role.tier}</strong> to{' '}
                        <strong>{selectedTier}</strong>. Click Save to apply the changes.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role.tierOverride && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-900 mb-1">Custom Limits Active</div>
                      <div className="text-sm text-amber-700">
                        This role has custom tier overrides applied. Changing the tier will not
                        affect the custom limits unless you remove the override first.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!hasChanges || changeTierMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || changeTierMutation.isPending || !selectedTier}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {changeTierMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

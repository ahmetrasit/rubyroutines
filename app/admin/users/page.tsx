'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Shield, ShieldCheck, Trash2, Edit2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <UsersContent />
    </AdminGuard>
  );
}

function UsersContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: usersData, isLoading } = trpc.adminUsers.search.useQuery({
    email: searchEmail || undefined,
    tier: selectedTier ? (selectedTier as any) : undefined,
    limit: 50,
  });

  const grantAdminMutation = trpc.adminUsers.grantAdmin.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Admin access granted',
      });
      utils.adminUsers.search.invalidate();
      setShowDetailsDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeAdminMutation = trpc.adminUsers.revokeAdmin.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Admin access revoked',
      });
      utils.adminUsers.search.invalidate();
      setShowDetailsDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = trpc.adminUsers.deleteUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deleted',
      });
      utils.adminUsers.search.invalidate();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage users, tiers, and permissions</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tiers</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="SCHOOL">School</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchEmail('');
                  setSelectedTier('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({usersData?.total || 0})
            </CardTitle>
            <CardDescription>
              Showing {usersData?.users.length || 0} of {usersData?.total || 0} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : usersData && usersData.users.length > 0 ? (
              <div className="space-y-3">
                {usersData.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{user.email}</span>
                        {user.isAdmin && (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {!user.emailVerified && (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{user._count.roles} roles</span>
                        <span>•</span>
                        <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {user.roles.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary">
                              {role.type} ({role.tier})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      {!user.isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Management</DialogTitle>
              <DialogDescription>
                Manage permissions and access for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Admin Access</h3>
                  {selectedUser.isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Administrator
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeAdminMutation.mutate({ userId: selectedUser.id })}
                        disabled={revokeAdminMutation.isPending}
                      >
                        Revoke Admin
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => grantAdminMutation.mutate({ userId: selectedUser.id })}
                      disabled={grantAdminMutation.isPending}
                      className="gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Grant Admin Access
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Roles ({selectedUser.roles.length})</h3>
                  <div className="space-y-2">
                    {selectedUser.roles.map((role: any) => (
                      <div key={role.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{role.type}</div>
                            <div className="text-sm text-muted-foreground">
                              Tier: {role.tier}
                            </div>
                          </div>
                          <Link href={`/admin/users/${selectedUser.id}/roles/${role.id}`}>
                            <Button variant="outline" size="sm">
                              Manage Tier
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
                All data associated with this user will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && deleteUserMutation.mutate({ userId: selectedUser.id })}
                disabled={deleteUserMutation.isPending}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

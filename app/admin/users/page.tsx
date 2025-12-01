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
import { Search, Shield, ShieldCheck, Trash2, Edit2, Users, Ban, UserX, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { TierBadgeSelect } from '@/components/admin/TierBadgeSelect';
import { Tier } from '@/lib/types/prisma-enums';
import { HomeButton } from '@/components/home-button';

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
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [permanentDeleteReason, setPermanentDeleteReason] = useState('');
  const [permanentDeleteConfirmText, setPermanentDeleteConfirmText] = useState('');
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);

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
        description: 'User soft-deleted',
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

  const permanentDeleteUserMutation = trpc.adminUsers.permanentlyDeleteUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User permanently deleted',
      });
      utils.adminUsers.search.invalidate();
      utils.adminUsers.statistics.invalidate();
      setShowPermanentDeleteDialog(false);
      setPermanentDeleteReason('');
      setPermanentDeleteConfirmText('');
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

  const verifyEmailMutation = trpc.adminUsers.verifyUserEmail.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email verified successfully',
      });
      utils.adminUsers.search.invalidate();
      utils.adminUsers.statistics.invalidate();
      setShowVerifyDialog(false);
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

  const changeTierMutation = trpc.adminUsers.changeTier.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tier updated successfully',
      });
      utils.adminUsers.search.invalidate();
      utils.adminUsers.statistics.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const banUserMutation = trpc.adminUsers.banUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User has been banned',
      });
      utils.adminUsers.search.invalidate();
      setShowBanDialog(false);
      setBanReason('');
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

  const unbanUserMutation = trpc.adminUsers.unbanUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User has been unbanned',
      });
      utils.adminUsers.search.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const impersonateMutation = trpc.adminUsers.startImpersonation.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Impersonation Started',
        description: `Token created. Expires at ${new Date(data.expiresAt).toLocaleTimeString()}`,
      });
      // Store the token for later use
      localStorage.setItem('impersonation_token', data.impersonationToken);
      setShowImpersonateDialog(false);
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
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handlePermanentDeleteUser = (user: any) => {
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setPermanentDeleteReason('');
    setPermanentDeleteConfirmText('');
    setShowPermanentDeleteDialog(true);
  };

  const handleTierChange = async (roleId: string, newTier: Tier) => {
    await changeTierMutation.mutateAsync({
      roleId,
      tier: newTier,
    });
  };

  const handleVerifyEmail = (user: any) => {
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setShowVerifyDialog(true);
  };

  const handleBanUser = (user: any) => {
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setBanReason('');
    setShowBanDialog(true);
  };

  const handleUnbanUser = (user: any) => {
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    unbanUserMutation.mutate({ userId: user.id });
  };

  const handleImpersonate = (user: any) => {
    if (!user?.id || typeof user.id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setShowImpersonateDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeButton />
            <div>
              <h1 className="text-3xl font-bold mb-1">User Management</h1>
              <p className="text-muted-foreground">Manage users, tiers, and permissions</p>
            </div>
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
                  <SelectItem value="TINY">Tiny</SelectItem>
                  <SelectItem value="SMALL">Small</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LARGE">Large</SelectItem>
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
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleVerifyEmail(user)}
                          >
                            Unverified (click to verify)
                          </Badge>
                        )}
                        {(user as any).bannedAt && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Banned
                          </Badge>
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
                            <TierBadgeSelect
                              key={role.id}
                              roleId={role.id}
                              roleType={role.type}
                              currentTier={role.tier as Tier}
                              onTierChange={handleTierChange}
                            />
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
                        <>
                          {(user as any).bannedAt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbanUser(user)}
                              disabled={unbanUserMutation.isPending}
                              title="Unban user"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBanUser(user)}
                              className="text-orange-600 hover:text-orange-700"
                              title="Ban user"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImpersonate(user)}
                            title="Impersonate user"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermanentDeleteUser(user)}
                            className="text-destructive hover:text-destructive border-destructive"
                            title="Permanent Delete (GDPR)"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1 text-xs">GDPR</span>
                          </Button>
                        </>
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

        {/* Soft Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Soft Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to soft-delete {selectedUser?.email}? This will mark the user as deleted
                but preserve data for potential recovery. For permanent deletion (GDPR compliance), use the
                Permanent Delete option.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!selectedUser?.id) {
                    toast({
                      title: 'Error',
                      description: 'Invalid user ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  deleteUserMutation.mutate({ userId: selectedUser.id });
                }}
                disabled={deleteUserMutation.isPending}
              >
                Soft Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permanent Delete Confirmation Dialog (GDPR) */}
        <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-destructive">Permanent Delete User (GDPR/COPPA Compliance)</DialogTitle>
              <DialogDescription className="space-y-2">
                <p className="font-semibold">WARNING: This action is IRREVERSIBLE!</p>
                <p>You are about to permanently delete {selectedUser?.email} and ALL associated data:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>User account will be removed from authentication system</li>
                  <li>All roles, persons, groups, routines, tasks, and completions will be PERMANENTLY deleted</li>
                  <li>All goals, marketplace items, comments, and ratings will be PERMANENTLY deleted</li>
                  <li>All sharing connections and invitations will be PERMANENTLY deleted</li>
                  <li>Audit logs will be anonymized (action preserved, PII removed)</li>
                </ul>
                <p className="text-destructive font-semibold mt-4">
                  This operation is intended for GDPR "Right to Erasure" and COPPA compliance requests only.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Deletion Reason (required):
                </label>
                <Input
                  placeholder="e.g., GDPR request, Parent request, COPPA compliance"
                  value={permanentDeleteReason}
                  onChange={(e) => setPermanentDeleteReason(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type DELETE to confirm:
                </label>
                <Input
                  placeholder="DELETE"
                  value={permanentDeleteConfirmText}
                  onChange={(e) => setPermanentDeleteConfirmText(e.target.value)}
                  className="w-full font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPermanentDeleteDialog(false);
                  setPermanentDeleteReason('');
                  setPermanentDeleteConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!selectedUser?.id) {
                    toast({
                      title: 'Error',
                      description: 'Invalid user ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  if (permanentDeleteConfirmText !== 'DELETE') {
                    toast({
                      title: 'Error',
                      description: 'Please type DELETE to confirm',
                      variant: 'destructive',
                    });
                    return;
                  }
                  if (!permanentDeleteReason || permanentDeleteReason.length < 5) {
                    toast({
                      title: 'Error',
                      description: 'Please provide a reason (minimum 5 characters)',
                      variant: 'destructive',
                    });
                    return;
                  }
                  permanentDeleteUserMutation.mutate({
                    userId: selectedUser.id,
                    reason: permanentDeleteReason
                  });
                }}
                disabled={
                  permanentDeleteUserMutation.isPending ||
                  permanentDeleteConfirmText !== 'DELETE' ||
                  !permanentDeleteReason ||
                  permanentDeleteReason.length < 5
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {permanentDeleteUserMutation.isPending ? 'Deleting...' : 'Permanently Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Verification Confirmation Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify User Email</DialogTitle>
              <DialogDescription>
                Are you sure you want to manually verify the email for {selectedUser?.email}?
                This will mark their email as verified in both the database and Supabase Auth.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedUser?.id) {
                    toast({
                      title: 'Error',
                      description: 'Invalid user ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  verifyEmailMutation.mutate({ userId: selectedUser.id });
                }}
                disabled={verifyEmailMutation.isPending}
              >
                Verify Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Are you sure you want to ban {selectedUser?.email}?
                This will prevent them from logging in until they are unbanned.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Ban Reason (optional):
              </label>
              <Input
                placeholder="e.g., Violation of terms of service"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!selectedUser?.id) {
                    toast({
                      title: 'Error',
                      description: 'Invalid user ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  banUserMutation.mutate({
                    userId: selectedUser.id,
                    reason: banReason || undefined,
                  });
                }}
                disabled={banUserMutation.isPending}
              >
                {banUserMutation.isPending ? 'Banning...' : 'Ban User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Impersonate User Dialog */}
        <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonate User</DialogTitle>
              <DialogDescription>
                You are about to impersonate {selectedUser?.email}.
                This will create a temporary session token (valid for 1 hour) that allows you to view the app as this user.
                All actions during impersonation are logged for security purposes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
              <p>During impersonation:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You can view the user&apos;s data and settings</li>
                <li>Changes made will affect the user&apos;s account</li>
                <li>All actions are logged with your admin ID</li>
                <li>The session expires automatically after 1 hour</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImpersonateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedUser?.id) {
                    toast({
                      title: 'Error',
                      description: 'Invalid user ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  impersonateMutation.mutate({ userId: selectedUser.id });
                }}
                disabled={impersonateMutation.isPending}
              >
                {impersonateMutation.isPending ? 'Starting...' : 'Start Impersonation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { StatCard } from '@/components/admin/StatCard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Users, UserCheck, Shield, BarChart3, Activity, Calendar, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = trpc.adminUsers.statistics.useQuery();
  const { data: recentActivity, isLoading: activityLoading } = trpc.adminAudit.getRecentActivity.useQuery({
    limit: 10,
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const { data: auditStats } = trpc.adminAudit.getStatistics.useQuery({
    startDate,
    endDate: new Date(),
  });

  const adminColor = '#dc2626'; // red-600

  // Convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '220, 38, 38'; // Default red RGB
  };

  const rgbColor = hexToRgb(adminColor);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top section with colored background */}
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto border-t-2 border-x-2 rounded-t-md"
          style={{
            borderColor: adminColor,
            backgroundColor: `rgba(${rgbColor}, 0.05)`
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">System overview and management</p>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/admin/users" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Manage users</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/tiers" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiers</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Configure tiers</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/marketplace" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Moderation</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Settings</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">System settings</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/audit" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Log</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View activity</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/moderation-logs" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moderation</CardTitle>
                <Shield className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Moderation logs</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
        </div>
      </div>

      {/* Stats and content section with white background */}
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-x-2 border-b-2 rounded-b-md"
          style={{ borderColor: adminColor }}
        >
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : stats ? (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                description={`${stats.recentUsers} new this month`}
              />
              <StatCard
                title="Verified Users"
                value={stats.verifiedUsers}
                icon={UserCheck}
                description={`${stats.unverifiedUsers} unverified`}
              />
              <StatCard
                title="Administrators"
                value={stats.totalAdmins}
                icon={Shield}
                description="System administrators"
              />
              <StatCard
                title="Total Roles"
                value={stats.totalRoles}
                icon={BarChart3}
                description="Parent + Teacher roles"
              />
            </>
          ) : null}
        </div>

        {/* Tier Distribution */}
        {stats && stats.tierDistributionByType && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
              <CardDescription>Breakdown of users by subscription tier and role type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Parent Mode Tiers - Purple */}
                <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-700 rounded-full"></span>
                    Parent Mode
                  </h3>
                  <div className="space-y-2">
                    {['FREE', 'BRONZE', 'GOLD', 'PRO'].map((tier) => {
                      const count = stats.tierDistributionByType.PARENT?.[tier] || 0;
                      return (
                        <div key={`parent-${tier}`} className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <span className="font-medium">{tier}</span>
                          <div className="text-right">
                            <span className="font-bold">{count}</span>
                            <span className="text-muted-foreground text-sm ml-2">
                              ({stats.totalRoles > 0 ? ((count / stats.totalRoles) * 100).toFixed(1) : '0'}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher Mode Tiers - Blue */}
                <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-700 rounded-full"></span>
                    Teacher Mode
                  </h3>
                  <div className="space-y-2">
                    {['FREE', 'BRONZE', 'GOLD', 'PRO'].map((tier) => {
                      const count = stats.tierDistributionByType.TEACHER?.[tier] || 0;
                      return (
                        <div key={`teacher-${tier}`} className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <span className="font-medium">{tier}</span>
                          <div className="text-right">
                            <span className="font-bold">{count}</span>
                            <span className="text-muted-foreground text-sm ml-2">
                              ({stats.totalRoles > 0 ? ((count / stats.totalRoles) * 100).toFixed(1) : '0'}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Admin Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Admin Activity
            </CardTitle>
            <CardDescription>Last 10 administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="border-l-4 border-primary/20 pl-4 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-muted-foreground">
                            by {log.user.email}
                          </span>
                        </div>
                        {log.changes && (
                          <div className="text-xs text-muted-foreground">
                            {log.entityType && `${log.entityType}: `}
                            {JSON.stringify(log.changes).substring(0, 100)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Activity Stats */}
        {auditStats && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Admin Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{auditStats.totalActions}</div>
                  <div className="text-sm text-muted-foreground">Total Actions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{auditStats.uniqueAdmins}</div>
                  <div className="text-sm text-muted-foreground">Active Admins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {auditStats.totalActions > 0 ? Math.round(auditStats.totalActions / auditStats.uniqueAdmins) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Actions per Admin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

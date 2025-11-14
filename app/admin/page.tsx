'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { StatCard } from '@/components/admin/StatCard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Users, UserCheck, Shield, BarChart3, Activity, Calendar } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        </div>

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
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
              <CardDescription>Breakdown of users by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.tierDistribution).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        tier === 'FREE' ? 'bg-gray-400' :
                        tier === 'BASIC' ? 'bg-blue-400' :
                        tier === 'PREMIUM' ? 'bg-purple-400' :
                        'bg-green-400'
                      }`} />
                      <span className="font-medium">{tier}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{count}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({((count / stats.totalRoles) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
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
  );
}

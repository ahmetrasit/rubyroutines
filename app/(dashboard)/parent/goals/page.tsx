'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GoalList } from '@/components/goal/goal-list';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentGoalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  // Get session and parent role
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const parentRole = session?.user?.roles?.find((role: any) => role.type === 'PARENT');

  // Get tier limits for the parent role
  const { data: effectiveLimits } = trpc.billing.getEffectiveLimits.useQuery(
    { roleId: parentRole?.id },
    { enabled: !!parentRole?.id }
  );

  // Get persons for person-specific goals
  const { data: persons } = trpc.person.list.useQuery(
    { roleId: parentRole?.id },
    { enabled: !!parentRole?.id }
  );

  // Get groups for group goals
  const { data: groups } = trpc.group.list.useQuery(
    { roleId: parentRole?.id },
    { enabled: !!parentRole?.id }
  );

  // Get all goals for summary stats
  const { data: allGoals } = trpc.goal.list.useQuery(
    { roleId: parentRole?.id },
    { enabled: !!parentRole?.id }
  );

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <ModeSwitcher currentMode="parent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!parentRole) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <ModeSwitcher currentMode="parent" />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Parent Role</h1>
          <p className="text-gray-600">You don't have a parent role yet.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const activeGoals = allGoals?.filter((g: any) => g.status === 'ACTIVE') || [];
  const completedGoals = activeGoals.filter((g: any) => g.progress?.achieved);
  const streakGoals = activeGoals.filter((g: any) => g.type === 'STREAK' && g.currentStreak > 0);

  // Get role color
  const roleColor = parentRole.color || '#9333ea';
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '147, 51, 234';
  };
  const rgbColor = hexToRgb(roleColor);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ModeSwitcher currentMode="parent" />

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto border-t-2 border-x-2 rounded-t-md"
          style={{
            borderColor: roleColor,
            backgroundColor: `rgba(${rgbColor}, 0.05)`
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/parent')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Title */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Target className="h-8 w-8 text-primary" />
                  Goals & Achievements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Set targets and track progress for your family
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeGoals.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {completedGoals.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {streakGoals.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {activeGoals.length > 0
                      ? Math.round((completedGoals.length / activeGoals.length) * 100)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Goals</TabsTrigger>
            {persons && persons.length > 0 && (
              <TabsTrigger value="byperson">By Person</TabsTrigger>
            )}
            {groups && groups.length > 0 && (
              <TabsTrigger value="bygroup">By Group</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all">
            <GoalList
              roleId={parentRole.id}
              effectiveLimits={effectiveLimits}
            />
          </TabsContent>

          <TabsContent value="byperson" className="space-y-6">
            {persons?.map((person: any) => (
              <Card key={person.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {person.name}'s Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalList
                    roleId={parentRole.id}
                    personId={person.id}
                    effectiveLimits={effectiveLimits}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="bygroup" className="space-y-6">
            {groups?.map((group: any) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {group.name} Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalList
                    roleId={parentRole.id}
                    groupId={group.id}
                    effectiveLimits={effectiveLimits}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
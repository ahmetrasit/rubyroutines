'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalFormWithTemplates } from '@/components/goal/goal-form-with-templates';
import { ClassroomGoalOverview } from '@/components/goal/classroom-goal-overview';
import { AssignGoalToClass } from '@/components/goal/assign-goal-to-class';
import { GoalAnalyticsChart } from '@/components/goal/goal-analytics-chart';
import { useActiveRole } from '@/lib/hooks';
import { trpc } from '@/lib/trpc/client';
import { RoleType } from '@/lib/types/prisma-enums';
import { Plus, Users, Target, TrendingUp, Award } from 'lucide-react';

export default function TeacherGoalsPage() {
  const activeRole = useActiveRole(RoleType.TEACHER);
  const roleId = activeRole?.id;
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch classroom goals
  const { data: goals, isLoading: goalsLoading } = trpc.goal.list.useQuery(
    { roleId: roleId || '' },
    { enabled: !!roleId }
  );

  // Fetch classroom students
  const { data: persons } = trpc.person.list.useQuery(
    { roleId: roleId || '' },
    { enabled: !!roleId }
  );

  // Calculate statistics
  const stats = {
    totalGoals: goals?.length || 0,
    activeStudents: persons?.filter((p: any) => p.status === 'ACTIVE').length || 0,
    groupGoals: goals?.filter((g: any) => g.scope === 'GROUP').length || 0,
    individualGoals: goals?.filter((g: any) => g.scope === 'INDIVIDUAL').length || 0,
  };

  if (!roleId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading role information...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classroom Goals</h1>
          <p className="text-gray-600">Track and manage goals for your entire classroom</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignForm(true)}>
            <Users className="h-4 w-4 mr-2" />
            Assign to Class
          </Button>
          <Button onClick={() => setShowGoalForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">Active classroom goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground">Active students tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Goals</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groupGoals}</div>
            <p className="text-xs text-muted-foreground">Classroom-wide goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individual Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.individualGoals}</div>
            <p className="text-xs text-muted-foreground">Student-specific goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="students">Student Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ClassroomGoalOverview roleId={roleId} persons={persons || []} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <GoalAnalyticsChart roleId={roleId} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {persons && persons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persons.map((person) => (
                <Card key={person.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                    <CardDescription>Individual progress tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoalAnalyticsChart roleId={roleId} personId={person.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No students added yet</p>
                <Button variant="outline" className="mt-4">
                  Add Students
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showGoalForm && (
        <GoalFormWithTemplates
          roleId={roleId}
          roleType={RoleType.TEACHER}
          onClose={() => setShowGoalForm(false)}
        />
      )}

      {showAssignForm && (
        <AssignGoalToClass
          roleId={roleId}
          persons={persons || []}
          onClose={() => setShowAssignForm(false)}
        />
      )}
    </div>
  );
}
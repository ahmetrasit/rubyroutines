'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { HomeButton } from '@/components/home-button';
import { CompletionChart } from '@/components/analytics/CompletionChart';
import { GoalProgressChart } from '@/components/analytics/GoalProgressChart';
import { TaskHeatmap } from '@/components/analytics/TaskHeatmap';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { ExportButton } from '@/components/analytics/ExportButton';
import { subDays } from 'date-fns';

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    days: 30,
  });

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

  // Find the user's primary role (parent or teacher)
  const user = session.user as any;
  const parentRole = user.roles?.find((role: any) => role.type === 'PARENT');
  const teacherRole = user.roles?.find((role: any) => role.type === 'TEACHER');
  const activeRole = parentRole || teacherRole;

  if (!activeRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Role Found</h1>
          <p className="text-gray-600">Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsPageContent
      roleId={activeRole.id}
      selectedPersonId={selectedPersonId}
      setSelectedPersonId={setSelectedPersonId}
      dateRange={dateRange}
      setDateRange={setDateRange}
    />
  );
}

interface AnalyticsPageContentProps {
  roleId: string;
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;
  dateRange: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  setDateRange: (range: { startDate: Date; endDate: Date; days: number }) => void;
}

function AnalyticsPageContent({
  roleId,
  selectedPersonId,
  setSelectedPersonId,
  dateRange,
  setDateRange,
}: AnalyticsPageContentProps) {
  const { data: persons } = trpc.person.list.useQuery({ roleId });

  const {
    data: completionData,
    isLoading: completionLoading,
  } = trpc.analytics.completionTrend.useQuery({
    roleId,
    personId: selectedPersonId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    days: dateRange.days,
  });

  const { data: goalData, isLoading: goalLoading } = trpc.analytics.goalProgress.useQuery({
    roleId,
    personId: selectedPersonId,
  });

  const { data: heatmapData, isLoading: heatmapLoading } = trpc.analytics.taskHeatmap.useQuery({
    roleId,
    personId: selectedPersonId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    days: dateRange.days,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HomeButton />
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Track completion rates, goal progress, and task patterns
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DateRangePicker onChange={setDateRange} initialDays={dateRange.days} />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Person
              </label>
              <select
                value={selectedPersonId || ''}
                onChange={(e) => setSelectedPersonId(e.target.value || null)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">All People</option>
                {persons?.map((person: any) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <ExportButton
              roleId={roleId}
              personId={selectedPersonId}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              days={dateRange.days}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Completion Trend */}
          <CompletionChart
            data={
              completionData?.map((d: any) => ({
                date: new Date(d.date),
                completionRate: d.completionRate,
              })) || []
            }
            isLoading={completionLoading}
          />

          {/* Goal Progress */}
          <GoalProgressChart
            data={
              goalData?.map((g: any) => ({
                goalId: g.goalId,
                goalName: g.goalName,
                progress: g.percentage || g.progress || 0,
                status: (g.status?.toUpperCase() || 'NOT_STARTED') as 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED',
              })) || []
            }
            isLoading={goalLoading}
          />

          {/* Task Heatmap */}
          <TaskHeatmap
            data={
              heatmapData?.flatMap((task: any) =>
                task.completions?.map((c: any) => ({
                  date: new Date(c.date),
                  taskName: task.taskName,
                  count: c.count,
                })) || []
              ) || []
            }
            isLoading={heatmapLoading}
          />
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Analytics</h3>
          <p className="text-sm text-blue-700">
            Analytics help you understand patterns in task completion and goal progress. Use the
            date range picker to explore different time periods, and filter by person to see
            individual insights. Export data to CSV for deeper analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

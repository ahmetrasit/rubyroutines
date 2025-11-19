'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { Loader2, TrendingUp, TrendingDown, Target, Trophy, Flame, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface GoalAnalyticsChartProps {
  roleId: string;
  personId?: string;
  groupId?: string;
}

export function GoalAnalyticsChart({ roleId, personId, groupId }: GoalAnalyticsChartProps) {
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');
  const [chartType, setChartType] = useState<'completion' | 'distribution' | 'streak' | 'timeline'>('completion');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = trpc.analytics.goalAchievementRate.useQuery({
    roleId,
    personId,
    groupId,
    period,
  });

  const { data: distributionData } = trpc.analytics.goalTypeDistribution.useQuery({
    roleId,
    personId,
    groupId,
  });

  const { data: streakData } = trpc.analytics.streakLeaderboard.useQuery({
    roleId,
    limit: 10,
  });

  const { data: trendsData } = trpc.analytics.goalTrends.useQuery({
    roleId,
    personId,
    groupId,
    period,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Colors for charts
  const COLORS = ['#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCF7F', '#C7CEEA', '#FFB6C1', '#DDA0DD', '#87CEEB'];

  // Format data for completion chart
  const completionChartData = trendsData?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    completed: item.completed,
    target: item.target,
    rate: Math.round((item.completed / item.target) * 100),
  })) || [];

  // Format data for distribution pie chart
  const distributionChartData = Object.entries(distributionData || {}).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count as number,
  }));

  // Format data for streak leaderboard
  const streakChartData = streakData?.map((person: any) => ({
    name: person.name,
    currentStreak: person.currentStreak,
    longestStreak: person.longestStreak,
  })) || [];

  // Calculate statistics
  const stats = {
    totalGoals: analyticsData?.totalGoals || 0,
    achievedGoals: analyticsData?.achievedGoals || 0,
    achievementRate: analyticsData?.achievementRate || 0,
    activeStreaks: analyticsData?.activeStreaks || 0,
    averageProgress: analyticsData?.averageProgress || 0,
    trend: analyticsData?.trend || 'stable',
  };

  const getTrendIcon = () => {
    if (stats.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (stats.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">Active goals being tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.achievementRate}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon()}
              <span>{stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Stable'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStreaks}</div>
            <p className="text-xs text-muted-foreground">Ongoing streak goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">Across all goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Goal Analytics</CardTitle>
              <CardDescription>Track goal progress and achievements over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
                <option value="QUARTER">Quarter</option>
                <option value="YEAR">Year</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="completion">Completion</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="streak">Streaks</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="completion" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={completionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#4ECDC4"
                    name="Completed"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#FF6B6B"
                    name="Target"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#6BCF7F"
                    name="Rate (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="distribution" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={distributionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="streak" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={streakChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentStreak" fill="#FFD93D" name="Current Streak" />
                  <Bar dataKey="longestStreak" fill="#FF6B6B" name="Longest Streak" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={completionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#4ECDC4"
                    fill="#4ECDC4"
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stackId="2"
                    stroke="#C7CEEA"
                    fill="#C7CEEA"
                    fillOpacity={0.6}
                    name="Achievement Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Streak Leaderboard */}
      {streakData && streakData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Streak Leaderboard</CardTitle>
            <CardDescription>Top performers maintaining goal streaks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {streakData.slice(0, 5).map((person: any, index: number) => (
                <div key={person.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.goalName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-bold">{person.currentStreak}</span>
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Best: {person.longestStreak} days
                      </p>
                    </div>
                    {index < 3 && (
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
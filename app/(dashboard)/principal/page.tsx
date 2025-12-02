'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  GraduationCap,
  UserPlus,
  Settings,
  School,
  Plus,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const LAST_MODE_KEY = 'rubyroutines_last_mode';

export default function PrincipalDashboard() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Store 'principal' as last visited mode on mount
  useEffect(() => {
    try {
      localStorage.setItem(LAST_MODE_KEY, 'principal');
      document.cookie = `${LAST_MODE_KEY}=principal; path=/; max-age=31536000`;
    } catch {
      // localStorage/cookie may be unavailable
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  // Get user's school memberships
  const user = session?.user as any;
  const schoolMemberships = user?.schoolMemberships || [];
  const principalSchools = schoolMemberships.filter(
    (m: any) => m.role === 'PRINCIPAL' && m.status === 'ACTIVE'
  );

  // Set default selected school
  useEffect(() => {
    if (principalSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalSchools[0].schoolId);
    }
  }, [principalSchools, selectedSchoolId]);

  // Get roleId from selected school membership
  const selectedMembership = principalSchools.find(
    (m: any) => m.schoolId === selectedSchoolId
  );
  const selectedRoleId = selectedMembership?.roleId;

  // Fetch school members for selected school
  const { data: schoolMembers } = trpc.school.getMembers.useQuery(
    { schoolId: selectedSchoolId!, roleId: selectedRoleId || '' },
    { enabled: !!selectedSchoolId && !!selectedRoleId }
  );

  // Fetch school classrooms
  const { data: schoolClassrooms } = trpc.school.getClassrooms.useQuery(
    { schoolId: selectedSchoolId!, roleId: selectedRoleId || '' },
    { enabled: !!selectedSchoolId && !!selectedRoleId }
  );

  // Fetch pending invitations
  const { data: pendingInvitations } = trpc.school.getPendingInvitations.useQuery(
    { schoolId: selectedSchoolId!, roleId: selectedRoleId || '' },
    { enabled: !!selectedSchoolId && !!selectedRoleId }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Check if user has principal access
  if (principalSchools.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <ModeSwitcher currentMode="principal" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <School className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">No Principal Access</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don&apos;t have principal access to any schools yet.
            </p>
            <Link href="/principal/create-school">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First School
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedSchool = principalSchools.find(
    (m: any) => m.schoolId === selectedSchoolId
  );

  // Count members by role
  const teachers = schoolMembers?.filter((m: any) => m.role === 'TEACHER') || [];
  const supportStaff = schoolMembers?.filter((m: any) => m.role === 'SUPPORT') || [];
  const totalStudents = schoolClassrooms?.reduce(
    (sum: number, c: any) => sum + (c._count?.members || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ModeSwitcher currentMode="principal" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Principal Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your school, teachers, and classrooms
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/principal/${selectedSchoolId}/invite`}>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Staff
              </Button>
            </Link>
            <Link href={`/principal/${selectedSchoolId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* School Selector (if multiple schools) */}
        {principalSchools.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select School
            </label>
            <select
              value={selectedSchoolId || ''}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-600"
            >
              {principalSchools.map((m: any) => (
                <option key={m.schoolId} value={m.schoolId}>
                  {m.school?.name || 'Unknown School'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* School Name Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <Building2 className="h-12 w-12" />
            <div>
              <h2 className="text-2xl font-bold">
                {selectedSchool?.school?.name || 'Your School'}
              </h2>
              <p className="text-amber-100">School Administration</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolClassrooms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active classrooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">School teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStaff.length}</div>
              <p className="text-xs text-muted-foreground">Support members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all classrooms</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teachers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teachers
              </CardTitle>
              <CardDescription>
                Teachers in your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="mb-4">No teachers yet</p>
                  <Link href={`/principal/${selectedSchoolId}/invite`}>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Teachers
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachers.slice(0, 5).map((teacher: any) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{teacher.userRole?.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{teacher.userRole?.user?.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                  {teachers.length > 5 && (
                    <Link href={`/principal/${selectedSchoolId}/teachers`}>
                      <Button variant="ghost" className="w-full">
                        View all {teachers.length} teachers
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classrooms Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Classrooms
              </CardTitle>
              <CardDescription>
                Classrooms connected to your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!schoolClassrooms || schoolClassrooms.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="mb-4">No classrooms connected</p>
                  <p className="text-sm">
                    Teachers can connect their classrooms to your school
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schoolClassrooms.slice(0, 5).map((classroom: any) => (
                    <div
                      key={classroom.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <School className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">{classroom.name}</p>
                          <p className="text-sm text-gray-500">
                            {classroom._count?.members || 0} students
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                  {schoolClassrooms.length > 5 && (
                    <Link href={`/principal/${selectedSchoolId}/classrooms`}>
                      <Button variant="ghost" className="w-full">
                        View all {schoolClassrooms.length} classrooms
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Staff Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Support Staff
              </CardTitle>
              <CardDescription>
                Support staff with access to school data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supportStaff.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="mb-4">No support staff yet</p>
                  <Link href={`/principal/${selectedSchoolId}/invite`}>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Support Staff
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {supportStaff.slice(0, 5).map((staff: any) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{staff.userRole?.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{staff.userRole?.user?.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingInvitations || pendingInvitations.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-sm text-gray-500">
                          {inv.schoolRole === 'TEACHER' ? 'Teacher' : 'Support Staff'} invitation
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

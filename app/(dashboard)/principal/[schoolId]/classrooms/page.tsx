'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, School, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function ClassroomsListPage() {
  const params = useParams();
  const schoolId = params?.schoolId as string;

  const { data: session } = trpc.auth.getSession.useQuery();

  // Get school membership for this school
  const user = session?.user as any;
  const membership = user?.schoolMemberships?.find(
    (m: any) => m.schoolId === schoolId && m.role === 'PRINCIPAL'
  );

  // Fetch school classrooms
  const { data: schoolClassrooms } = trpc.school.getClassrooms.useQuery(
    { schoolId, roleId: membership?.roleId || '' },
    { enabled: !!schoolId && !!membership?.roleId }
  );

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have principal access to this school.
            </p>
            <Link href="/principal">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = schoolClassrooms?.reduce(
    (sum: number, c: any) => sum + (c._count?.members || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/principal">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <School className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Classrooms</CardTitle>
                <CardDescription>
                  {schoolClassrooms?.length || 0} classroom{(schoolClassrooms?.length || 0) !== 1 ? 's' : ''} with {totalStudents} total students
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!schoolClassrooms || schoolClassrooms.length === 0 ? (
              <div className="text-center py-12">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No classrooms connected yet</p>
                <p className="text-sm text-gray-400">
                  Teachers can connect their classrooms to your school from their dashboard
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {schoolClassrooms.map((classroom: any) => (
                  <div
                    key={classroom.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <School className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{classroom.name}</p>
                        {classroom.description && (
                          <p className="text-sm text-gray-500">{classroom.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Users className="h-3 w-3" />
                            {classroom._count?.members || 0} students
                          </span>
                          {classroom.role?.user && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <GraduationCap className="h-3 w-3" />
                              {classroom.role.user.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

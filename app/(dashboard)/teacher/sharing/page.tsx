'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CoTeacherList } from '@/components/coteacher/CoTeacherList';
import { ShareModal } from '@/components/coteacher/ShareModal';
import { GenerateCodeModal } from '@/components/connection/GenerateCodeModal';
import { Share2, Key, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TeacherSharingPage() {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

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

  // Find teacher role
  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER');

  if (!teacherRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Teacher Role</h1>
          <p className="text-gray-600">
            You don&apos;t have a teacher role yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/teacher">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classroom Sharing</h1>
            <p className="text-gray-600 mt-2">
              Share classrooms with co-teachers and generate parent connection codes
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Classrooms Section */}
          <ClassroomsList
            roleId={teacherRole.id}
            onShareClassroom={(groupId) => {
              setSelectedGroupId(groupId);
              setShowShareModal(true);
            }}
            onGenerateCode={(groupId) => {
              setSelectedGroupId(groupId);
              setShowGenerateCodeModal(true);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareModal
          roleId={teacherRole.id}
          groupId={selectedGroupId}
          onClose={() => {
            setShowShareModal(false);
            setSelectedGroupId('');
          }}
        />
      )}

      {showGenerateCodeModal && (
        <GenerateCodeModal
          roleId={teacherRole.id}
          groupId={selectedGroupId}
          onClose={() => {
            setShowGenerateCodeModal(false);
            setSelectedGroupId('');
          }}
        />
      )}
    </div>
  );
}

// Classrooms List Component
function ClassroomsList({
  roleId,
  onShareClassroom,
  onGenerateCode,
}: {
  roleId: string;
  onShareClassroom: (groupId: string) => void;
  onGenerateCode: (groupId: string) => void;
}) {
  const { data: groups, isLoading } = trpc.group.list.useQuery({ roleId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading classrooms...</div>
        </CardContent>
      </Card>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Classrooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-2">No classrooms yet</p>
            <p className="text-sm text-gray-400">
              Create a classroom first to share with co-teachers
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group: any) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{group.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateCode(group.id)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Parent Connection Code
                </Button>
                <Button size="sm" onClick={() => onShareClassroom(group.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with Co-Teacher
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CoTeacherList groupId={group.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

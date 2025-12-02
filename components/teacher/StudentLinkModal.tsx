'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Link2, Link2Off, Search, Loader2, AlertCircle } from 'lucide-react';
import { useAvatar } from '@/lib/hooks';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';

interface StudentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  /** If provided, show links for this specific student */
  studentId?: string;
  studentName?: string;
}

function StudentAvatar({ avatar, name }: { avatar: string | null; name: string }) {
  const { color, emoji, backgroundColor } = useAvatar({
    avatarString: avatar,
    fallbackName: name,
  });

  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 flex-shrink-0"
      style={{ backgroundColor, borderColor: color }}
    >
      <RenderIconEmoji value={emoji} className="h-5 w-5" />
    </div>
  );
}

export function StudentLinkModal({
  isOpen,
  onClose,
  roleId,
  studentId,
  studentName,
}: StudentLinkModalProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Get all students for this teacher
  const { data: allPersons, isLoading: personsLoading } = trpc.person.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  // Get existing links
  const { data: existingLinks, isLoading: linksLoading } = trpc.teacherStudentLink.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  // Get links for specific student if provided
  const { data: studentLinks } = trpc.teacherStudentLink.getForStudent.useQuery(
    { roleId, personId: studentId! },
    { enabled: !!roleId && !!studentId }
  );

  const createLinkMutation = trpc.teacherStudentLink.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Students linked successfully' });
      utils.teacherStudentLink.list.invalidate();
      utils.teacherStudentLink.getForStudent.invalidate();
      setSelectedStudents([]);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const removeLinkMutation = trpc.teacherStudentLink.remove.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Link removed' });
      utils.teacherStudentLink.list.invalidate();
      utils.teacherStudentLink.getForStudent.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Filter to only students (not teachers/account owners)
  const students = useMemo(() => {
    if (!allPersons) return [];
    return allPersons.filter((p) => !p.isTeacher && !p.isAccountOwner && p.status === 'ACTIVE');
  }, [allPersons]);

  // Filter by search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const lowerSearch = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(lowerSearch));
  }, [students, search]);

  // Build a set of linked student IDs for the current student
  const linkedStudentIds = useMemo(() => {
    if (!studentId || !studentLinks) return new Set<string>();
    return new Set(
      studentLinks.flatMap((link) => {
        if (link.primaryStudentId === studentId) {
          return [link.linkedStudentId];
        }
        return [link.primaryStudentId];
      })
    );
  }, [studentId, studentLinks]);

  // Exclude current student and already linked students from selection
  const availableStudents = useMemo(() => {
    if (!studentId) return filteredStudents;
    return filteredStudents.filter(
      (s) => s.id !== studentId && !linkedStudentIds.has(s.id)
    );
  }, [filteredStudents, studentId, linkedStudentIds]);

  const handleToggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreateLinks = async () => {
    if (!studentId || selectedStudents.length === 0) return;

    // Create links one by one
    for (const linkedId of selectedStudents) {
      await createLinkMutation.mutateAsync({
        roleId,
        primaryStudentId: studentId,
        linkedStudentId: linkedId,
      });
    }
  };

  const handleRemoveLink = (linkId: string) => {
    removeLinkMutation.mutate({ roleId, linkId });
  };

  const isLoading = personsLoading || linksLoading;
  const isMutating = createLinkMutation.isPending || removeLinkMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {studentId ? `Link Students with ${studentName}` : 'Manage Student Links'}
          </DialogTitle>
          <DialogDescription>
            {studentId
              ? 'Link this student with others so they see merged tasks in personal kiosk mode.'
              : 'View and manage linked students across your classrooms.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Current links for this student */}
            {studentId && studentLinks && studentLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Currently Linked</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {studentLinks.map((link) => {
                    const linkedStudent =
                      link.primaryStudentId === studentId
                        ? link.linkedStudent
                        : link.primaryStudent;
                    return (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <StudentAvatar
                            avatar={linkedStudent?.avatar ?? null}
                            name={linkedStudent?.name || 'Unknown'}
                          />
                          <span className="font-medium">{linkedStudent?.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLink(link.id)}
                          disabled={isMutating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Link2Off className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add new links */}
            {studentId && (
              <>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Link</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                  {availableStudents.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No students available to link</p>
                    </div>
                  ) : (
                    availableStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleToggleStudent(student.id)}
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                        />
                        <StudentAvatar avatar={student.avatar} name={student.name} />
                        <span className="font-medium">{student.name}</span>
                      </div>
                    ))
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={handleCreateLinks}
                      disabled={isMutating}
                      className="w-full"
                    >
                      {isMutating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Link {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Overview mode - show all links */}
            {!studentId && (
              <div className="flex-1 overflow-y-auto">
                {existingLinks && existingLinks.length > 0 ? (
                  <div className="space-y-2">
                    {existingLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <StudentAvatar
                            avatar={link.primaryStudent?.avatar ?? null}
                            name={link.primaryStudent?.name || 'Unknown'}
                          />
                          <span className="font-medium">{link.primaryStudent?.name}</span>
                          <Link2 className="h-4 w-4 text-gray-400" />
                          <StudentAvatar
                            avatar={link.linkedStudent?.avatar ?? null}
                            name={link.linkedStudent?.name || 'Unknown'}
                          />
                          <span className="font-medium">{link.linkedStudent?.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLink(link.id)}
                          disabled={isMutating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Link2Off className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Link2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No linked students yet</p>
                    <p className="text-sm mt-1">
                      Click on a student card to link them with others
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

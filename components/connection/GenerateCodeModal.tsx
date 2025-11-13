'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Copy, Key, Clock } from 'lucide-react';

interface GenerateCodeModalProps {
  roleId: string;
  groupId: string;
  onClose: () => void;
}

export function GenerateCodeModal({ roleId, groupId, onClose }: GenerateCodeModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [generatedCode, setGeneratedCode] = useState<{ code: string; expiresAt: Date } | null>(null);

  const { toast } = useToast();

  // Get list of students in the classroom
  const { data: students, isLoading: studentsLoading } = trpc.person.list.useQuery({
    roleId
  });

  const generateMutation = trpc.connection.generateCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data);
      toast({
        title: 'Success',
        description: 'Connection code generated',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedStudentId) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      roleId,
      studentPersonId: selectedStudentId,
    });
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      toast({
        title: 'Success',
        description: 'Code copied to clipboard',
        variant: 'success',
      });
    }
  };

  const getTimeUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate Connection Code
          </DialogTitle>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Generate a code to share with a student&apos;s parent. They&apos;ll use this code to
                connect their child at home to your student record.
              </p>
            </div>

            {/* Student Selector */}
            <div>
              <Label htmlFor="student">Select Student *</Label>
              {studentsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading students...</div>
              ) : students && students.length > 0 ? (
                <Select
                  id="student"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="mt-1"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map((student: any) => {
                    const avatar = parseAvatar(student.avatar);
                    return (
                      <option key={student.id} value={student.id}>
                        {avatar.emoji} {student.name}
                      </option>
                    );
                  })}
                </Select>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg mt-1">
                  <p className="text-gray-500">No students in this classroom</p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedStudentId}
              >
                {generateMutation.isPending ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">
                Connection code generated successfully!
              </p>
            </div>

            {/* Code Display */}
            <div className="text-center">
              <Label className="text-sm text-gray-600 mb-2 block">Connection Code</Label>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-3">
                <div className="font-mono text-4xl font-bold text-gray-900 tracking-widest">
                  {generatedCode.code}
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleCopyCode}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>

            {/* Expiry Info */}
            <div className="flex items-center gap-2 justify-center text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Expires in {getTimeUntilExpiry(generatedCode.expiresAt)}
              </span>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Share this code with the parent.</strong> They should enter it in their
                parent dashboard to connect their child to this student.
              </p>
            </div>

            {/* Close Button */}
            <DialogFooter>
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

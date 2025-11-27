'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Copy, Check, Mail } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';

interface SharePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  persons: Array<{ id: string; name: string; avatar?: string }>;
}

export function SharePersonModal({
  isOpen,
  onClose,
  roleId,
  roleType,
  persons,
}: SharePersonModalProps) {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [shareType, setShareType] = useState<'PERSON' | 'FULL_ROLE'>('PERSON');
  const [permissions, setPermissions] = useState<'VIEW' | 'EDIT' | 'MANAGE'>('VIEW');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateCodeMutation = trpc.personSharing.generateInvite.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      setEmailSent(data.emailSent || false);
      toast({
        title: 'Success',
        description: data.emailSent
          ? 'Share code generated and invitation email sent'
          : 'Share code generated successfully',
        variant: 'default',
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
    if (shareType === 'PERSON' && selectedPersons.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one person to share',
        variant: 'destructive',
      });
      return;
    }

    generateCodeMutation.mutate({
      ownerRoleId: roleId,
      ownerPersonId: shareType === 'PERSON' ? selectedPersons[0] : undefined,
      shareType,
      permissions,
      expiresInDays: 90,
      maxUses: shareType === 'FULL_ROLE' ? 1 : undefined,
      recipientEmail: recipientEmail || undefined,
    });
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Share code copied to clipboard',
        variant: 'default',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSelectedPersons([]);
    setShareType('PERSON');
    setPermissions('VIEW');
    setRecipientEmail('');
    setGeneratedCode(null);
    setEmailSent(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {generatedCode ? 'Share Code Generated' : `Share ${roleType === 'PARENT' ? 'Kids' : 'Students'}`}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 -mt-2 -mr-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogHeader>

        {!generatedCode ? (
          <>
            <div className="space-y-6 py-4">
              {/* Share Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to share?
                </label>
                <Select value={shareType} onValueChange={(value) => setShareType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSON">
                      Specific {roleType === 'PARENT' ? 'Kids' : 'Students'}
                    </SelectItem>
                    <SelectItem value="FULL_ROLE">
                      Everything (Co-{roleType === 'PARENT' ? 'Parent' : 'Teacher'})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Person Selection */}
              {shareType === 'PERSON' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select {roleType === 'PARENT' ? 'Kids' : 'Students'}
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {persons.map((person) => (
                      <label
                        key={person.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedPersons.includes(person.id)}
                          onChange={(e) => {
                            setSelectedPersons((prev) =>
                              e.target.checked
                                ? [...prev, person.id]
                                : prev.filter((id) => id !== person.id)
                            );
                          }}
                        />
                        <div className="flex items-center gap-2">
                          {person.avatar && (
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="font-medium">{person.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Level
                </label>
                <Select value={permissions} onValueChange={(value) => setPermissions(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">View Only (See progress)</SelectItem>
                    <SelectItem value="EDIT">Edit (Complete tasks)</SelectItem>
                    <SelectItem value="MANAGE">Manage (Full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Invitation (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email Invitation (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, an invitation email will be sent with the share code
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  How it works
                </h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>A unique share code will be generated</li>
                  <li>Share the code with the other {roleType.toLowerCase()}</li>
                  <li>They enter the code in their dashboard to connect</li>
                  <li>Code expires in 90 days if not used</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateCodeMutation.isPending}
              >
                {generateCodeMutation.isPending
                  ? 'Generating...'
                  : 'Generate Share Code'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Success State with Code */}
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 mb-2">
                Share this code with the other {roleType.toLowerCase()}
              </p>
              {emailSent && (
                <p className="text-sm text-green-600 mb-4 flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Invitation email sent successfully
                </p>
              )}

              <div className="flex items-center gap-2 max-w-md mx-auto">
                <code className="flex-1 p-3 bg-white border-2 border-green-300 rounded-lg text-xl font-mono text-green-700">
                  {generatedCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="px-4"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Code expires in 90 days
              </p>
            </div>

            {/* Done Button */}
            <DialogFooter>
              <Button onClick={handleClose} className="mx-auto">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
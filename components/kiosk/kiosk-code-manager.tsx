'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Copy, X, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';

export function KioskCodeManager() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [expirationHours, setExpirationHours] = useState('3');
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get current role ID - we'll need this for the query
  const { data: session } = trpc.auth.getSession.useQuery();
  const roleId = session?.user?.roles?.[0]?.id || '';

  const { data: codes, isLoading } = trpc.kiosk.listCodes.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  const generateMutation = trpc.kiosk.generateCode.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Kiosk code generated: ${data.code}`,
        variant: 'success',
      });
      utils.kiosk.listCodes.invalidate();
      setShowGenerateDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeMutation = trpc.kiosk.revokeCode.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Kiosk code revoked',
        variant: 'success',
      });
      utils.kiosk.listCodes.invalidate();
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
    const hours = parseInt(expirationHours);
    if (hours < 1 || hours > 24) {
      toast({
        title: 'Error',
        description: 'Expiration must be between 1 and 24 hours',
        variant: 'destructive',
      });
      return;
    }

    if (!roleId) {
      toast({
        title: 'Error',
        description: 'No role found',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({ roleId, expiresInHours: hours });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Success',
      description: 'Code copied to clipboard',
      variant: 'success',
    });
  };

  const handleRevoke = (codeId: string) => {
    if (confirm('Are you sure you want to revoke this code?')) {
      revokeMutation.mutate({ codeId });
    }
  };

  const activeCodes = codes?.filter((c: any) => c.status === 'ACTIVE') || [];
  const expiredCodes = codes?.filter((c: any) => c.status === 'EXPIRED' || c.status === 'REVOKED') || [];

  const formatExpirationDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      return 'Expired';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} left`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hr${hours !== 1 ? 's' : ''} left`;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>🔑</span>
              Kiosk Access Codes
            </CardTitle>
            <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading codes...</div>
          ) : activeCodes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 mb-2">No active kiosk codes</p>
              <p className="text-sm text-gray-400 mb-4">
                Generate a code to allow kiosk access
              </p>
              <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate First Code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Active Codes</h4>
              {activeCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-mono text-lg font-bold text-gray-900">
                      {code.code}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatExpirationDate(code.expiresAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCode(code.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(code.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {expiredCodes.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mt-6">
                    Expired/Revoked Codes
                  </h4>
                  {expiredCodes.slice(0, 3).map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
                    >
                      <div className="flex-1">
                        <div className="font-mono text-sm font-bold text-gray-600">
                          {code.code}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {(code as any).status.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Kiosk Code</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Code Expiration
              </label>
              <Select
                value={expirationHours}
                onChange={(e) => setExpirationHours(e.target.value)}
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Kiosk codes allow anyone to access task completion
                for your persons. Keep them secure and revoke when no longer needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Code
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

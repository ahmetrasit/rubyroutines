'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Key, Bookmark } from 'lucide-react';
import { ImportFromCodeModal } from '@/components/marketplace/ImportFromCodeModal';
import { useRouter } from 'next/navigation';

interface GetRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
}

export function GetRoutinesModal({ isOpen, onClose, roleId }: GetRoutinesModalProps) {
  const router = useRouter();
  const [showImportCode, setShowImportCode] = useState(false);

  const handleCommunityRoutines = () => {
    onClose();
    router.push('/community-routines');
  };

  const handlePrivateCode = () => {
    setShowImportCode(true);
  };

  const handleSavedRoutines = () => {
    onClose();
    router.push('/saved-routines');
  };

  const handleImportCodeClose = () => {
    setShowImportCode(false);
  };

  return (
    <>
      <Dialog open={isOpen && !showImportCode} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Get Routines</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Community Routines */}
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
              onClick={handleCommunityRoutines}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Community Routines</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse public routines shared by the community
                </p>
              </CardContent>
            </Card>

            {/* Private Code */}
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300"
              onClick={handlePrivateCode}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Key className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Private Code</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enter a share code from another user
                </p>
              </CardContent>
            </Card>

            {/* Saved Routines */}
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-amber-300"
              onClick={handleSavedRoutines}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Bookmark className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Saved Routines</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Routines you saved for later
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Code Modal */}
      <ImportFromCodeModal
        isOpen={showImportCode}
        onClose={handleImportCodeClose}
        roleId={roleId}
      />
    </>
  );
}

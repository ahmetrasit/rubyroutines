'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { LinkGoalDialog } from './link-goal-dialog';

interface LinkToGoalButtonProps {
  entityType: 'task' | 'routine';
  entityId: string;
  entityName: string;
  currentGoalIds?: string[];
  onLinked?: () => void;
}

export function LinkToGoalButton({
  entityType,
  entityId,
  entityName,
  currentGoalIds = [],
  onLinked,
}: LinkToGoalButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2"
      >
        <Target className="h-4 w-4" />
        {currentGoalIds.length > 0 ? `Linked to ${currentGoalIds.length} goal${currentGoalIds.length > 1 ? 's' : ''}` : 'Link to Goal'}
      </Button>

      <LinkGoalDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        currentGoalIds={currentGoalIds}
        onLinked={onLinked}
      />
    </>
  );
}

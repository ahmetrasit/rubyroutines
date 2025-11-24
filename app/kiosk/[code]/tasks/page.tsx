'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TaskList } from '@/components/kiosk/task-list';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { useOptimisticCheckin, useOptimisticUndo } from '@/lib/hooks/useOptimisticCheckin';

export default function KioskTasksPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const personId = searchParams.get('personId');
  const [sessionData, setSessionData] = useState<any>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date>(new Date());
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isPageVisible = usePageVisibility();

  useEffect(() => {
    // Verify session from localStorage
    const stored = localStorage.getItem('kiosk_session');
    if (!stored) {
      router.push('/kiosk');
      return;
    }

    try {
      const session = JSON.parse(stored);
      if (session.code !== code) {
        router.push('/kiosk');
        return;
      }

      // Check if session expired
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        localStorage.removeItem('kiosk_session');
        router.push('/kiosk');
        return;
      }

      setSessionData(session);
    } catch (error) {
      router.push('/kiosk');
    }
  }, [code, router]);

  useEffect(() => {
    if (!personId) {
      router.push(`/kiosk/${code}`);
    }
  }, [personId, code, router]);

  const { data: person, isLoading: personLoading } = trpc.person.getById.useQuery(
    { id: personId! },
    { enabled: !!sessionData && !!personId }
  );

  // Fetch person's tasks for kiosk mode
  const { data: personTasksData, isLoading: tasksLoading } = trpc.kiosk.getPersonTasks.useQuery(
    { kioskCodeId: sessionData?.codeId!, personId: personId! },
    {
      enabled: !!sessionData && !!personId,
      refetchInterval: false, // Disable auto refetch, using optimized polling instead
      staleTime: 30 * 1000, // 30 seconds - kiosk data needs more frequent updates
      cacheTime: 2 * 60 * 1000, // 2 minutes cache for kiosk
      refetchOnWindowFocus: false, // Already handled by polling
    }
  );

  const tasks = personTasksData?.tasks || [];

  // Optimized polling: check for updates every 15 seconds, pause when page not visible
  useEffect(() => {
    if (!sessionData?.codeId || !personId || !isPageVisible) return;

    const interval = setInterval(async () => {
      try {
        const result = await utils.kiosk.checkRoleUpdates.fetch({
          kioskCodeId: sessionData.codeId,
          lastCheckedAt
        });

        if (result.hasUpdates) {
          utils.kiosk.getPersonTasks.invalidate();
          setLastCheckedAt(result.lastUpdatedAt);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, 15000); // Check every 15 seconds (optimized from 5s)

    return () => clearInterval(interval);
  }, [sessionData?.codeId, personId, lastCheckedAt, utils, isPageVisible]);

  // Use optimistic mutations for instant UI feedback
  const baseCompleteMutation = trpc.kiosk.completeTask.useMutation();
  const completeMutation = useOptimisticCheckin(baseCompleteMutation, {
    personId: personId!,
    personKey: ['kiosk', 'getPersonTasks', { kioskCodeId: sessionData?.codeId!, personId: personId! }],
    onSuccess: async () => {
      // Invalidate goal queries for real-time progress updates
      await utils.goal.list.invalidate();
      await utils.goal.getGoalsForTask.invalidate();
      await utils.goal.getGoalsForRoutine.invalidate();
      setLastCheckedAt(new Date()); // Update timestamp to prevent redundant refetch
    },
    onCelebration: () => {
      // Could trigger confetti or other celebration here
    },
  });

  const baseUndoMutation = trpc.kiosk.undoCompletion.useMutation();
  const undoMutation = useOptimisticUndo(baseUndoMutation, {
    personId: personId!,
    messages: {
      success: 'Task completion undone',
    },
  });

  const handleComplete = (taskId: string, value?: string) => {
    // Prevent double submissions during mutation
    if (completeMutation.isPending) return;

    completeMutation.mutate({
      kioskCodeId: sessionData!.codeId,
      taskId,
      personId: personId!,
      value,
    });
  };

  const handleUndo = (completionId: string) => {
    // Prevent double submissions during mutation
    if (undoMutation.isPending) return;

    undoMutation.mutate({ kioskCodeId: sessionData!.codeId, completionId });
  };

  const handleExit = () => {
    localStorage.removeItem('kiosk_session');
    router.push('/kiosk');
  };

  const handleTimeout = () => {
    handleExit();
  };

  if (!sessionData || !personId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (personLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return null;
  }

  return (
    <>
      <SessionTimeout
        expiresAt={new Date(sessionData.expiresAt)}
        onTimeout={handleTimeout}
      />
      <TaskList
        tasks={tasks || []}
        personId={personId}
        personName={person.name}
        onComplete={handleComplete}
        onUndo={handleUndo}
        onExit={handleExit}
      />
    </>
  );
}

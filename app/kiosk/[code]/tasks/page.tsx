'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TaskList } from '@/components/kiosk/task-list';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { trpc } from '@/lib/trpc/client';
import { getQueryKey } from '@trpc/react-query';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { useOptimisticKioskCheckin, useOptimisticKioskUndo } from '@/lib/hooks/useOptimisticKioskCheckin';

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

  // Get the actual tRPC query key for kiosk tasks
  const kioskTasksQueryKey = sessionData?.codeId && personId
    ? getQueryKey(trpc.kiosk.getPersonTasks, { kioskCodeId: sessionData.codeId, personId }, 'query')
    : undefined;

  // Debug: Log query key and inspect cache
  useEffect(() => {
    if (kioskTasksQueryKey) {
      console.log('🔑 [Kiosk Page] Generated query key:', JSON.stringify(kioskTasksQueryKey));

      // Inspect all kiosk-related queries in cache
      const cache = utils.client.getQueryCache();
      const allQueries = cache.getAll();
      console.log('📦 [Kiosk Page] All cache queries:', allQueries.length);

      allQueries.forEach(query => {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('kiosk')) {
          console.log('  Found kiosk query:', keyStr);
          console.log('  Has data:', !!query.state.data);
        }
      });
    }
  }, [kioskTasksQueryKey, utils]);

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
  const completeMutation = useOptimisticKioskCheckin(baseCompleteMutation, {
    kioskCodeId: sessionData?.codeId!,
    personId: personId!,
    kioskTasksKey: kioskTasksQueryKey,
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
  const undoMutation = useOptimisticKioskUndo(baseUndoMutation, {
    kioskCodeId: sessionData?.codeId!,
    personId: personId!,
    messages: {
      success: 'Task completion undone',
    },
  });

  const handleComplete = (taskId: string, value?: string) => {
    console.log('🎯 [Kiosk Page] handleComplete called:', { taskId, value });
    console.log('🎯 [Kiosk Page] mutation pending?', completeMutation.isPending);

    // Prevent double submissions during mutation
    if (completeMutation.isPending) {
      console.log('⚠️ [Kiosk Page] Mutation already pending, skipping');
      return;
    }

    console.log('🚀 [Kiosk Page] Calling mutation with:', {
      kioskCodeId: sessionData!.codeId,
      taskId,
      personId: personId!,
      value,
    });

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

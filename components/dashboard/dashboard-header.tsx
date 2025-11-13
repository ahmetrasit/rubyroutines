'use client';

import { ModeSwitcher } from './mode-switcher';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface DashboardHeaderProps {
  user: any;
  title: string;
  description?: string;
}

export function DashboardHeader({ user, title, description }: DashboardHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
      router.push('/login');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="bg-white shadow-sm border-b mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            <ModeSwitcher roles={user.roles || []} />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name || user.email}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

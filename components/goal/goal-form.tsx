'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { ResetPeriod } from '@/lib/types/prisma-enums';

interface GoalFormProps {
  goal?: any;
  personId?: string;
  onClose: () => void;
}

export function GoalForm({ goal, personId, onClose }: GoalFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState<ResetPeriod>(ResetPeriod.WEEKLY);
  const [resetDay, setResetDay] = useState<number | undefined>();

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get current user's role
  const { data: session } = trpc.auth.getSession.useQuery();
  const roleId = session?.user?.roles?.[0]?.id || '';

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setDescription(goal.description || '');
      setTarget(goal.target?.toString() || '');
      setPeriod(goal.period || ResetPeriod.WEEKLY);
      setResetDay(goal.resetDay);
    }
  }, [goal]);

  const createMutation = trpc.goal.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal created successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = trpc.goal.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal updated successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a goal name',
        variant: 'destructive',
      });
      return;
    }

    if (!target || parseFloat(target) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid target value',
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

    const data = {
      name: name.trim(),
      roleId,
      description: description.trim() || undefined,
      target: parseFloat(target),
      period,
      resetDay,
      personIds: personId ? [personId] : [],
    };

    if (goal) {
      updateMutation.mutate({ id: goal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Complete 50 tasks this week"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target *</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g., 50"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period *</Label>
                <Select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as ResetPeriod)}
                  disabled={isPending}
                >
                  <option value={ResetPeriod.DAILY}>Daily</option>
                  <option value={ResetPeriod.WEEKLY}>Weekly</option>
                  <option value={ResetPeriod.MONTHLY}>Monthly</option>
                </Select>
              </div>
            </div>

            {period === ResetPeriod.WEEKLY && (
              <div className="space-y-2">
                <Label htmlFor="resetDay">Reset Day</Label>
                <Select
                  id="resetDay"
                  value={resetDay?.toString() || '0'}
                  onChange={(e) => setResetDay(parseInt(e.target.value))}
                  disabled={isPending}
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </Select>
              </div>
            )}

            {period === ResetPeriod.MONTHLY && (
              <div className="space-y-2">
                <Label htmlFor="resetDay">Reset Day of Month</Label>
                <Input
                  id="resetDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={resetDay?.toString() || '1'}
                  onChange={(e) => setResetDay(parseInt(e.target.value))}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {goal ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                goal ? 'Update Goal' : 'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

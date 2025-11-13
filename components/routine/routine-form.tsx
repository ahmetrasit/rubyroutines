'use client';

import { Routine, ResetPeriod, Visibility } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RoutineFormProps {
  routine?: Routine;
  roleId?: string;
  personIds?: string[];
  onClose: () => void;
}

export function RoutineForm({ routine, roleId, personIds = [], onClose }: RoutineFormProps) {
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [resetPeriod, setResetPeriod] = useState<ResetPeriod>(
    routine?.resetPeriod || ResetPeriod.DAILY
  );
  const [resetDay, setResetDay] = useState<number | null>(routine?.resetDay || null);
  const [visibility, setVisibility] = useState<Visibility>(
    routine?.visibility || Visibility.ALWAYS
  );

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createMutation = trpc.routine.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Routine created successfully',
        variant: 'success',
      });
      utils.routine.list.invalidate();
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

  const updateMutation = trpc.routine.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Routine updated successfully',
        variant: 'success',
      });
      utils.routine.list.invalidate();
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

    if (routine) {
      updateMutation.mutate({
        id: routine.id,
        name: name || undefined,
        description: description || null,
        resetPeriod,
        resetDay,
        visibility,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name,
        description: description || undefined,
        resetPeriod,
        resetDay,
        visibility,
        visibleDays: [],
        personIds,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{routine ? 'Edit Routine' : 'Create New Routine'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Morning Routine"
              disabled={routine?.name === 'Daily Routine'}
            />
            {routine?.name === 'Daily Routine' && (
              <p className="text-xs text-gray-500 mt-1">
                The Daily Routine name cannot be changed
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Get ready for school..."
            />
          </div>

          <div>
            <Label htmlFor="resetPeriod">Reset Period *</Label>
            <select
              id="resetPeriod"
              value={resetPeriod}
              onChange={(e) => setResetPeriod(e.target.value as ResetPeriod)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={ResetPeriod.DAILY}>Daily</option>
              <option value={ResetPeriod.WEEKLY}>Weekly</option>
              <option value={ResetPeriod.MONTHLY}>Monthly</option>
            </select>
          </div>

          {resetPeriod === ResetPeriod.WEEKLY && (
            <div>
              <Label htmlFor="resetDay">Reset Day *</Label>
              <select
                id="resetDay"
                value={resetDay || 0}
                onChange={(e) => setResetDay(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}

          {resetPeriod === ResetPeriod.MONTHLY && (
            <div>
              <Label htmlFor="resetDay">Reset Day *</Label>
              <Input
                id="resetDay"
                type="number"
                min={1}
                max={28}
                value={resetDay || 1}
                onChange={(e) => setResetDay(parseInt(e.target.value))}
                placeholder="1-28 or 99 for last day"
              />
              <p className="text-xs text-gray-500 mt-1">Use 99 for last day of month</p>
            </div>
          )}

          <div>
            <Label htmlFor="visibility">Visibility *</Label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={Visibility.ALWAYS}>Always Visible</option>
              <option value={Visibility.DAYS_OF_WEEK}>Specific Days</option>
              <option value={Visibility.DATE_RANGE}>Date Range</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : routine ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

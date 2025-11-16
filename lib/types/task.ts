/**
 * Task Types
 * Proper TypeScript interfaces for Task-related data
 */

import { TaskType, EntityStatus } from './prisma-enums';

export interface Task {
  id: string;
  routineId: string;
  name: string;
  description: string | null;
  type: TaskType;
  isSmart: boolean;
  conditionId: string | null;
  order: number;
  unit: string | null;
  emoji: string | null;
  color: string | null;
  status: EntityStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithRelations extends Task {
  routine?: {
    id: string;
    name: string;
    roleId: string;
  };
  completions?: Array<{
    id: string;
    taskId: string;
    personId: string;
    completedAt: Date;
    value: string | null;
  }>;
}

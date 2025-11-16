/**
 * Soft Delete Utilities
 *
 * Provides type-safe soft delete functionality for User and Role models
 * Soft-deleted records are never physically removed from the database
 */

import { PrismaClient } from '@prisma/client';

export type SoftDeletableModel = 'user' | 'role';

/**
 * Soft delete a record by setting deletedAt timestamp
 */
export async function softDelete(
  prisma: PrismaClient,
  model: SoftDeletableModel,
  id: string
): Promise<void> {
  const now = new Date();

  if (model === 'user') {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: now },
    });
  } else if (model === 'role') {
    await prisma.role.update({
      where: { id },
      data: { deletedAt: now },
    });
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreSoftDeleted(
  prisma: PrismaClient,
  model: SoftDeletableModel,
  id: string
): Promise<void> {
  if (model === 'user') {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  } else if (model === 'role') {
    await prisma.role.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}

/**
 * Find records excluding soft-deleted ones
 * Add to where clause: ...excludeSoftDeleted()
 */
export function excludeSoftDeleted() {
  return {
    deletedAt: null,
  };
}

/**
 * Find only soft-deleted records
 * Add to where clause: ...onlySoftDeleted()
 */
export function onlySoftDeleted() {
  return {
    deletedAt: { not: null },
  };
}

/**
 * Check if a record is soft-deleted
 */
export function isSoftDeleted(record: { deletedAt: Date | null }): boolean {
  return record.deletedAt !== null;
}

/**
 * Archive a record (for models with archivedAt field)
 * Used for Person, Group, Routine, Task, Goal
 */
export async function archive(
  prisma: PrismaClient,
  model: 'person' | 'group' | 'routine' | 'task' | 'goal',
  id: string
): Promise<void> {
  const now = new Date();
  const data = { archivedAt: now, status: 'ARCHIVED' as const };

  switch (model) {
    case 'person':
      await prisma.person.update({ where: { id }, data });
      break;
    case 'group':
      await prisma.group.update({ where: { id }, data });
      break;
    case 'routine':
      await prisma.routine.update({ where: { id }, data });
      break;
    case 'task':
      await prisma.task.update({ where: { id }, data });
      break;
    case 'goal':
      await prisma.goal.update({ where: { id }, data });
      break;
  }
}

/**
 * Unarchive a record
 */
export async function unarchive(
  prisma: PrismaClient,
  model: 'person' | 'group' | 'routine' | 'task' | 'goal',
  id: string
): Promise<void> {
  const data = { archivedAt: null, status: 'ACTIVE' as const };

  switch (model) {
    case 'person':
      await prisma.person.update({ where: { id }, data });
      break;
    case 'group':
      await prisma.group.update({ where: { id }, data });
      break;
    case 'routine':
      await prisma.routine.update({ where: { id }, data });
      break;
    case 'task':
      await prisma.task.update({ where: { id }, data });
      break;
    case 'goal':
      await prisma.goal.update({ where: { id }, data });
      break;
  }
}

/**
 * Exclude archived records
 */
export function excludeArchived() {
  return {
    status: { not: 'ARCHIVED' as const },
  };
}

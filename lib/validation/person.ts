import { z } from 'zod';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { idValidator } from './id-validator';

export const createPersonSchema = z.object({
  roleId: idValidator,
  name: z.string().min(1, 'Name is required').max(100),
  birthDate: z.coerce.date().optional(),
  avatar: z.string().optional(), // Can be URL or JSON string
  notes: z.string().max(500).optional(),
});

export const updatePersonSchema = z.object({
  id: idValidator,
  name: z.string().min(1).max(100).optional(),
  birthDate: z.coerce.date().optional().nullable(),
  avatar: z.string().optional().nullable(), // Can be URL or JSON string
  notes: z.string().max(500).optional().nullable(),
});

export const deletePersonSchema = z.object({
  id: idValidator,
});

export const restorePersonSchema = z.object({
  id: idValidator,
});

export const listPersonsSchema = z.object({
  roleId: idValidator,
  includeInactive: z.boolean().optional().default(false),
});

export const getPersonSchema = z.object({
  id: idValidator,
});

export const getBatchPersonsSchema = z.object({
  ids: z.array(idValidator).min(1).max(100), // Limit to 100 persons per batch
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type DeletePersonInput = z.infer<typeof deletePersonSchema>;
export type RestorePersonInput = z.infer<typeof restorePersonSchema>;
export type ListPersonsInput = z.infer<typeof listPersonsSchema>;
export type GetPersonInput = z.infer<typeof getPersonSchema>;
export type GetBatchPersonsInput = z.infer<typeof getBatchPersonsSchema>;

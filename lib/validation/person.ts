import { z } from 'zod';
import { EntityStatus } from '@prisma/client';

export const createPersonSchema = z.object({
  roleId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  birthDate: z.coerce.date().optional(),
  avatar: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export const updatePersonSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  birthDate: z.coerce.date().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const deletePersonSchema = z.object({
  id: z.string().cuid(),
});

export const restorePersonSchema = z.object({
  id: z.string().cuid(),
});

export const listPersonsSchema = z.object({
  roleId: z.string().cuid(),
  includeInactive: z.boolean().optional().default(false),
});

export const getPersonSchema = z.object({
  id: z.string().cuid(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type DeletePersonInput = z.infer<typeof deletePersonSchema>;
export type RestorePersonInput = z.infer<typeof restorePersonSchema>;
export type ListPersonsInput = z.infer<typeof listPersonsSchema>;
export type GetPersonInput = z.infer<typeof getPersonSchema>;

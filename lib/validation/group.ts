import { z } from 'zod';
import { GroupType } from '@prisma/client';

export const createGroupSchema = z.object({
  roleId: z.string().cuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(GroupType),
  description: z.string().max(500).optional(),
});

export const updateGroupSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const deleteGroupSchema = z.object({
  id: z.string().cuid(),
});

export const addMemberSchema = z.object({
  groupId: z.string().cuid(),
  personId: z.string().cuid(),
});

export const removeMemberSchema = z.object({
  groupId: z.string().cuid(),
  personId: z.string().cuid(),
});

export const listGroupsSchema = z.object({
  roleId: z.string().cuid(),
  includeInactive: z.boolean().optional().default(false),
});

export const getGroupByIdSchema = z.object({
  id: z.string().cuid(),
});

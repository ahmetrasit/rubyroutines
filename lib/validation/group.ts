import { idValidator } from './id-validator';
import { z } from 'zod';
import { GroupType } from '@/lib/types/prisma-enums';

const colorValidator = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional();
const emojiValidator = z.string().max(50).optional(); // Emoji or icon:IconName

export const createGroupSchema = z.object({
  roleId: idValidator,
  name: z.string().min(1).max(100),
  type: z.nativeEnum(GroupType),
  description: z.string().max(500).optional(),
  emoji: emojiValidator,
  color: colorValidator,
});

export const updateGroupSchema = z.object({
  id: idValidator,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  emoji: emojiValidator,
  color: colorValidator,
});

export const deleteGroupSchema = z.object({
  id: idValidator,
});

export const addMemberSchema = z.object({
  groupId: idValidator,
  personId: idValidator,
});

export const removeMemberSchema = z.object({
  groupId: idValidator,
  personId: idValidator,
});

export const listGroupsSchema = z.object({
  roleId: idValidator,
  includeInactive: z.boolean().optional().default(false),
});

export const getGroupByIdSchema = z.object({
  id: idValidator,
});

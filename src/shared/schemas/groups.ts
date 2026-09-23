import { z } from 'zod';

export const GroupKind = z.enum(['class', 'individual']);
export const GroupColor = z.enum(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']);

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(80),
  workplaceId: z.string(),
  kind: GroupKind,
  packId: z.string().optional().default('generic'),
  room: z.string().optional(),
  color: GroupColor,
  termId: z.string().optional(),
  learnerName: z.string().min(1).max(80).optional() // For individual groups
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  room: z.string().optional(),
  color: GroupColor.optional(),
  termId: z.string().optional()
});

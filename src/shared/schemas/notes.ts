import { z } from 'zod';

export const QueryNotesSchema = z.object({
  learnerId: z.string().optional(),
  groupId: z.string().optional(),
  sessionId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().optional()
});

export type QueryNotesInput = z.infer<typeof QueryNotesSchema>;

export const CreateNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  sessionId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  learnerId: z.string().nullable().optional()
}).refine(data => {
  // NOT-002 / DM constraint: At least one target must be set
  return Boolean(data.sessionId || data.groupId || data.learnerId);
}, {
  message: 'errors.note_target_required',
  path: ['target']
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

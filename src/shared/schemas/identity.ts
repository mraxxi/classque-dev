import { z } from 'zod';

export const UpdateMeSchema = z.object({
  locale: z.enum(['en', 'id']).optional(),
  timezone: z.string().optional(),
  week_start: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
  group_label: z.enum(['group', 'class']).optional(),
  display_name: z.string().min(1).optional()
});

export type UpdateMe = z.infer<typeof UpdateMeSchema>;

export const IdentitySchema = z.object({
  userId: z.string(),
  accountId: z.string(),
  email: z.string().email(),
  role: z.enum(['teacher'])
});

export type Identity = z.infer<typeof IdentitySchema>;

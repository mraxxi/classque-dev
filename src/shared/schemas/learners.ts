import { z } from 'zod';

export const CreateLearnerSchema = z.object({
  displayName: z.string().min(1).max(80)
});

export const UpdateLearnerSchema = z.object({
  displayName: z.string().min(1).max(80).optional()
});

export const BulkAddLearnersSchema = z.object({
  names: z.array(z.string().min(1)).optional(),
  learnerIds: z.array(z.string()).optional()
}).refine(data => data.names || data.learnerIds, {
  message: "Either names or learnerIds must be provided"
});

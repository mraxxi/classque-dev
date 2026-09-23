import { z } from 'zod';

export const WorkplaceKind = z.enum(['institution', 'independent']);

export const CreateWorkplaceSchema = z.object({
  kind: WorkplaceKind,
  name: z.string().min(1).max(80)
});

export const UpdateWorkplaceSchema = z.object({
  name: z.string().min(1).max(80).optional()
});

export const CreateTermSchema = z.object({
  name: z.string().min(1).max(60),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).refine(data => data.startsOn <= data.endsOn, {
  message: "Start date must be before or equal to end date",
  path: ["endsOn"]
});

export const UpdateTermSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).refine(data => {
  if (data.startsOn && data.endsOn) {
    return data.startsOn <= data.endsOn;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["endsOn"]
});

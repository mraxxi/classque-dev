import { z } from 'zod';
import type { SubjectPack } from '../packs/types';

export const QueryPlansSchema = z.object({
  q: z.string().max(100).optional(),
  packId: z.string().max(50).optional(),
  includeArchived: z.string().transform(v => v === 'true').optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().optional()
});

export type QueryPlansInput = z.infer<typeof QueryPlansSchema>;

export const CreatePlanSchema = z.object({
  title: z.string().trim().min(1).max(120),
  packId: z.string().min(1).default('generic'),
  content: z.record(z.any()).default({})
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.record(z.any()).optional()
});

export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;

export const AttachPlanSchema = z.object({
  planId: z.string().nullable()
});

export type AttachPlanInput = z.infer<typeof AttachPlanSchema>;

/**
 * Generates a dynamic Zod schema for validating a Plan's content JSON
 * based on the Subject Pack's planTemplate (PLN-002).
 * 
 * Rules:
 * - 'text': max 4000 characters. If required, length >= 1.
 * - 'list': max 30 items, each item max 200 characters. If required, at least 1 item.
 * - 'pairs': term & definition rows, max 60 pairs. If required, at least 1 pair.
 * - PK-003: Unknown or legacy keys are preserved (.passthrough()).
 */
export function createPlanContentSchema(pack: SubjectPack) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const section of pack.planTemplate) {
    if (section.kind === 'text') {
      let schema = z.string().max(4000);
      if (section.required) {
        schema = schema.min(1, 'errors.required');
        shape[section.key] = schema;
      } else {
        shape[section.key] = schema.optional().default('');
      }
    } else if (section.kind === 'list') {
      const itemSchema = z.string().max(200);
      let listSchema = z.array(itemSchema).max(30);
      if (section.required) {
        listSchema = listSchema.min(1, 'errors.required');
        shape[section.key] = listSchema;
      } else {
        shape[section.key] = listSchema.optional().default([]);
      }
    } else if (section.kind === 'pairs') {
      const pairSchema = z.object({
        term: z.string().max(200),
        definition: z.string().max(2000)
      });
      let pairsSchema = z.array(pairSchema).max(60);
      if (section.required) {
        pairsSchema = pairsSchema.min(1, 'errors.required');
        shape[section.key] = pairsSchema;
      } else {
        shape[section.key] = pairsSchema.optional().default([]);
      }
    }
  }

  return z.object(shape).passthrough();
}

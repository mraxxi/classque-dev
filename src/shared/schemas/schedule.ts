import { z } from 'zod';

export const Weekday = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  z.literal(5), z.literal(6), z.literal(7)
]);

export const CreateScheduleRuleSchema = z.object({
  weekdays: z.array(Weekday).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(5).max(600),
  room: z.string().optional(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).refine(data => !data.endsOn || data.startsOn <= data.endsOn, {
  message: "Start date must be before or equal to end date",
  path: ["endsOn"]
});

export const UpdateScheduleRuleSchema = z.object({
  weekdays: z.array(Weekday).min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().min(5).max(600).optional(),
  room: z.string().optional(),
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

export const CreateSessionSchema = z.object({
  groupId: z.string(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(5).max(600),
  room: z.string().optional()
});

export const UpdateSessionSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().min(5).max(600).optional(),
  room: z.string().optional()
});

export const RescheduleSessionSchema = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(5).max(600),
  room: z.string().optional()
});

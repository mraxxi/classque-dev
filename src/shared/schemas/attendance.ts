import { z } from 'zod';

export const AttendanceStatus = z.enum(['present', 'absent', 'late', 'excused']);

export const AttendanceRecordSchema = z.object({
  learnerId: z.string(),
  status: AttendanceStatus,
  note: z.string().max(200).optional()
});

export const SaveAttendanceSchema = z.object({
  records: z.array(AttendanceRecordSchema)
});

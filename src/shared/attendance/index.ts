export type AttendanceCounts = {
  present: number;
  late: number;
  absent: number;
  excused: number;
};

/**
 * Calculates the attendance rate.
 * Formula: (present + late) / (present + late + absent)
 * Excused is excluded from the denominator.
 */
export function calculateAttendanceRate(counts: AttendanceCounts): number {
  const denominator = counts.present + counts.late + counts.absent;
  if (denominator === 0) return 0; // Avoid division by zero, though spec doesn't explicitly define empty rate
  return (counts.present + counts.late) / denominator;
}

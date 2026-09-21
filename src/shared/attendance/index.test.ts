import { describe, it, expect } from 'vitest';
import { calculateAttendanceRate } from './index';

describe('calculateAttendanceRate', () => {
  it('calculates 3 present, 1 late, 1 absent, 2 excused as 80%', () => {
    const rate = calculateAttendanceRate({
      present: 3,
      late: 1,
      absent: 1,
      excused: 2
    });
    expect(rate).toBe(0.8);
  });

  it('returns 0 when denominator is 0', () => {
    const rate = calculateAttendanceRate({
      present: 0,
      late: 0,
      absent: 0,
      excused: 5
    });
    expect(rate).toBe(0);
  });
});

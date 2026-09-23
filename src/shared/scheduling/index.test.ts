import { describe, it, expect } from 'vitest';
import { generateSessionDates, checkOverlap, getTopUpWindow } from './index';

describe('generateSessionDates', () => {
  it('generates dates matching the weekdays in the window', () => {
    // 2026-09-22 is a Tuesday (2), 2026-09-24 is a Thursday (4)
    const dates = generateSessionDates([2, 4], '2026-09-21', '2026-10-05');
    
    expect(dates).toEqual([
      '2026-09-22', // Tue
      '2026-09-24', // Thu
      '2026-09-29', // Tue
      '2026-10-01', // Thu
    ]);
  });

  it('returns empty array if start is after end', () => {
    const dates = generateSessionDates([2, 4], '2026-10-05', '2026-09-21');
    expect(dates).toEqual([]);
  });
});

describe('checkOverlap', () => {
  it('detects overlapping time ranges', () => {
    expect(checkOverlap(
      { startTime: '10:00', durationMin: 60 },
      { startTime: '10:30', durationMin: 60 }
    )).toBe(true);
  });

  it('detects back-to-back ranges as non-overlapping', () => {
    expect(checkOverlap(
      { startTime: '10:00', durationMin: 60 },
      { startTime: '11:00', durationMin: 60 }
    )).toBe(false);
  });

  it('detects enclosed ranges as overlapping', () => {
    expect(checkOverlap(
      { startTime: '10:00', durationMin: 120 },
      { startTime: '11:00', durationMin: 30 }
    )).toBe(true);
  });
});

describe('getTopUpWindow', () => {
  it('starts from today if rule started in the past', () => {
    const window = getTopUpWindow('2026-09-21', '2026-09-01');
    expect(window.start).toBe('2026-09-21');
  });

  it('starts from rule start if today is before rule start', () => {
    const window = getTopUpWindow('2026-09-21', '2026-10-01');
    expect(window.start).toBe('2026-10-01');
  });

  it('bounds end by 56 days by default', () => {
    const window = getTopUpWindow('2026-09-21', '2026-09-21');
    expect(window.end).toBe('2026-11-16'); // 21 Sep + 56 days
  });

  it('bounds end by rule end if earlier', () => {
    const window = getTopUpWindow('2026-09-21', '2026-09-21', '2026-10-31');
    expect(window.end).toBe('2026-10-31');
  });

  it('bounds end by term end if earlier than rule end and 56 days limit', () => {
    const window = getTopUpWindow('2026-09-21', '2026-09-21', '2026-12-31', '2026-10-15');
    expect(window.end).toBe('2026-10-15');
  });
});

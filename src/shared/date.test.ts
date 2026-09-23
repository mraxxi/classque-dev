import { describe, it, expect } from 'vitest';
import { isValidTimezone } from './date';

describe('isValidTimezone', () => {
  it('returns true for valid timezones', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Asia/Jakarta')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
  });

  it('returns false for invalid timezones', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    expect(isValidTimezone('UTC+7')).toBe(false); // Valid offsets are not always valid IANA names in Intl
  });
});

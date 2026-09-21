/**
 * Get current UTC instant as ISO-8601 string
 */
export function getNowInstant(): string {
  return new Date().toISOString();
}

/**
 * Validates if string is a valid IANA timezone
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

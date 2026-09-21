
/**
 * Parses YYYY-MM-DD to a UTC Date object (ignoring real timezone) 
 * so we can do local calendar math safely.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-');
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

function formatLocalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns ISO weekday: 1=Mon, ..., 7=Sun
 */
function getIsoWeekday(date: Date): number {
  const day = date.getUTCDay(); // 0=Sun, 1=Mon
  return day === 0 ? 7 : day;
}

export function generateSessionDates(
  weekdays: number[],
  windowStart: string,
  windowEnd: string
): string[] {
  if (windowStart > windowEnd) return [];
  
  const dates: string[] = [];
  const current = parseLocalDate(windowStart);
  const end = parseLocalDate(windowEnd);

  const validDays = new Set(weekdays);

  while (current <= end) {
    if (validDays.has(getIsoWeekday(current))) {
      dates.push(formatLocalDate(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export type TimeRange = {
  startTime: string; // HH:mm
  durationMin: number;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

export function checkOverlap(a: TimeRange, b: TimeRange): boolean {
  const startA = timeToMinutes(a.startTime);
  const endA = startA + a.durationMin;
  
  const startB = timeToMinutes(b.startTime);
  const endB = startB + b.durationMin;
  
  // Intersecting [start, end)
  return startA < endB && startB < endA;
}

export function getTopUpWindow(
  today: string, // YYYY-MM-DD
  ruleStartsOn: string,
  ruleEndsOn?: string,
  termEndsOn?: string
): { start: string, end: string } {
  const start = today > ruleStartsOn ? today : ruleStartsOn;
  
  let end = formatLocalDate(new Date(parseLocalDate(today).getTime() + 56 * 24 * 60 * 60 * 1000));
  
  if (ruleEndsOn && ruleEndsOn < end) end = ruleEndsOn;
  if (termEndsOn && termEndsOn < end) end = termEndsOn;
  
  return { start, end };
}

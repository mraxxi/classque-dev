export function formatTime(timeStr: string | undefined, locale: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  
  // Since time is wall-clock and timezone-aware, we use Intl.DateTimeFormat
  const d = new Date();
  d.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0);
  
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC' // We just want to display the wall clock time given in the string
  }).format(d);
}

export function formatDate(dateStr: string | undefined, locale: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
  
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

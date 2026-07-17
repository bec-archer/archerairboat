// All business times are America/New_York (Matlacha). Operator phones will
// almost always be in ET too, but format explicitly in the business zone so a
// snowbird checking from Ohio in July still sees boat-local times.

export const BUSINESS_TZ = 'America/New_York';

/** 'YYYY-MM-DD' for a Date, in the business timezone. */
export function dayKey(d: Date, tz: string = BUSINESS_TZ): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(d);
}

export function timeLabel(iso: string, tz: string = BUSINESS_TZ): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

export function dateLabel(iso: string, tz: string = BUSINESS_TZ): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date(iso));
}

export function fullDateLabel(iso: string, tz: string = BUSINESS_TZ): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(iso));
}

/** Weekday index (0=Sun) of a 'YYYY-MM-DD' day in the business timezone. */
export function weekdayOf(day: string): number {
  // Noon UTC avoids any DST edge flipping the date.
  const d = new Date(`${day}T12:00:00Z`);
  const name = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS_TZ, weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

/** Add n days to a 'YYYY-MM-DD' key. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the UTC instant for a business-local wall time on a given day.
 * Works for any ET offset (EST/EDT) without a tz library: compute the offset
 * the zone had at an approximate instant, then correct.
 */
export function zonedTimeToUtc(day: string, time: string, tz: string = BUSINESS_TZ): Date {
  const [h, m] = time.split(':').map(Number);
  const guess = new Date(`${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  const offsetMin = tzOffsetMinutes(guess, tz);
  const corrected = new Date(guess.getTime() - offsetMin * 60_000);
  // One correction pass handles DST-boundary days.
  const offset2 = tzOffsetMinutes(corrected, tz);
  return offset2 === offsetMin ? corrected : new Date(guess.getTime() - offset2 * 60_000);
}

function tzOffsetMinutes(at: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour), Number(parts.minute), Number(parts.second)
  );
  return (asUtc - at.getTime()) / 60_000;
}

/** Month grid: array of 'YYYY-MM-DD' (or null pads) for a given year/month (0-based month). */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const lead = weekdayOf(first.toISOString().slice(0, 10));
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

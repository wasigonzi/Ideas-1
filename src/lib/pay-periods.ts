/**
 * Biweekly (14-day) pay period utilities.
 *
 * The anchor is the LAST day (payday) of a known pay period.
 * Every other payday is exactly 14 days later/earlier.
 *
 * Default anchor: 2026-05-22 — stored in SiteSetting key "payroll_anchor".
 * Format stored: "YYYY-MM-DD" (local PR date).
 */

export const DEFAULT_ANCHOR = "2026-05-22"; // first known payday
export const PERIOD_DAYS = 14;

export interface PayPeriod {
  /** First day of the period (inclusive) */
  start: Date;
  /** Last day / payday (inclusive) */
  end: Date;
  /** Human-readable label, e.g. "9 may – 22 may 2026" */
  label: string;
  /** ISO date string of the payday (end), used as ID */
  key: string;
  /** true if today falls inside this period */
  isCurrent: boolean;
}

/** Parse a "YYYY-MM-DD" anchor string as local midnight. */
function parseAnchor(anchor: string): Date {
  const [y, m, d] = anchor.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Format a Date as a locale-friendly string in Spanish (PR). */
function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" });
}

/** ISO "YYYY-MM-DD" for a Date (local). */
export function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Given an anchor (payday) date and a reference date,
 * return the PayPeriod that contains the reference date.
 */
export function getPeriodForDate(anchor: Date, ref: Date): PayPeriod {
  // Normalize both to midnight
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);
  const r = new Date(ref);
  r.setHours(0, 0, 0, 0);

  const diffMs = r.getTime() - a.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  // Which period index? Periods go: ...-2, -1, 0, 1, 2, ...
  // Period 0 ends on anchor. Period 1 ends on anchor+14, etc.
  // For a given diffDays:
  //   if diffDays in [0..13]  → period 0 (anchor is payday)
  //   if diffDays in [-14..-1] → period -1 (anchor-14 is payday)
  const periodIndex = diffDays >= 0
    ? Math.floor(diffDays / PERIOD_DAYS)
    : Math.floor((diffDays - (PERIOD_DAYS - 1)) / PERIOD_DAYS);

  return buildPeriod(a, periodIndex, r);
}

function buildPeriod(anchor: Date, index: number, today?: Date): PayPeriod {
  const endMs = anchor.getTime() + index * PERIOD_DAYS * 86_400_000;
  const end = new Date(endMs);
  const start = new Date(endMs - (PERIOD_DAYS - 1) * 86_400_000);

  // End-of-day for comparisons
  const endEod = new Date(end);
  endEod.setHours(23, 59, 59, 999);

  const now = today ?? new Date();
  const nowNorm = new Date(now);
  nowNorm.setHours(0, 0, 0, 0);

  const isCurrent = nowNorm >= start && nowNorm <= end;

  const label = `${fmtDate(start)} – ${fmtDate(end)}`;

  return { start, end, label, key: localISODate(end), isCurrent };
}

/**
 * Return the last `count` pay periods (most recent first).
 * If `today` is not provided, uses current date.
 */
export function listRecentPeriods(anchor: string, count: number, today?: Date): PayPeriod[] {
  const anchorDate = parseAnchor(anchor);
  const ref = today ?? new Date();
  const current = getPeriodForDate(anchorDate, ref);

  // Determine index of the current period relative to anchor
  const currentEndMs = current.end.getTime();
  const anchorMs = anchorDate.getTime();
  const currentIndex = Math.round((currentEndMs - anchorMs) / (PERIOD_DAYS * 86_400_000));

  const periods: PayPeriod[] = [];
  for (let i = 0; i < count; i++) {
    periods.push(buildPeriod(anchorDate, currentIndex - i, ref));
  }
  return periods;
}

/**
 * Return the current pay period.
 */
export function currentPeriod(anchor: string, today?: Date): PayPeriod {
  const anchorDate = parseAnchor(anchor);
  return getPeriodForDate(anchorDate, today ?? new Date());
}

/**
 * Return the next pay period (upcoming).
 */
export function nextPeriod(anchor: string, today?: Date): PayPeriod {
  const anchorDate = parseAnchor(anchor);
  const ref = today ?? new Date();
  const cur = getPeriodForDate(anchorDate, ref);
  const nextEnd = new Date(cur.end.getTime() + PERIOD_DAYS * 86_400_000);
  return getPeriodForDate(anchorDate, nextEnd);
}

/** Format a payday date nicely for display. */
export function formatPayday(end: Date): string {
  return end.toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

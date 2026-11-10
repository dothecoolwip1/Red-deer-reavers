// The 3-month no-show rule and the removal timer, shared by the screens and their tests.
// The database applies the same rule (reavers_app_bot_daily) when the Discord bot tells leadership.

export const NO_SHOW_MONTHS = 3;
export const TIMER_CHOICES = [14, 30, 60] as const;
export const DEFAULT_TIMER_DAYS = 30;

export type PersonStatus = "active" | "away" | "removal" | "removed";
export type AttendanceFacts = {
  status: PersonStatus; started_on: string | null; created_at?: string | null; last_seen: string | null; removal_deadline: string | null;
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };

/** The same calendar day `months` months away, clamped to the month's end (like Postgres date arithmetic). */
export function addMonths(day: string, months: number): string {
  const d = parse(day);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return iso(target);
}

export const daysBetween = (from: string, to: string) => Math.round((parse(to).getTime() - parse(from).getTime()) / 864e5);

/** What the no-show clock counts from: the last time they were marked present, else when they started. */
export const absentSince = (p: AttendanceFacts) => p.last_seen || p.started_on || (p.created_at ? p.created_at.slice(0, 10) : null);

/** Active and not seen for more than three months. People marked away, or already on a timer, aren't counted again. */
export function isNoShow(p: AttendanceFacts, today: string): boolean {
  if (p.status !== "active") return false;
  const since = absentSince(p);
  return Boolean(since && since <= addMonths(today, -NO_SHOW_MONTHS));
}

export type TimerState = { running: false } | { running: true; daysLeft: number; expired: boolean };
export function timerState(p: Pick<AttendanceFacts, "status" | "removal_deadline">, today: string): TimerState {
  if (p.status !== "removal" || !p.removal_deadline) return { running: false };
  const daysLeft = daysBetween(today, p.removal_deadline);
  return { running: true, daysLeft: Math.max(0, daysLeft), expired: daysLeft <= 0 };
}

/** How often they came in the last three months: gatherings attended out of gatherings held since they started. */
export function recentRate(attended: number, gatheringDates: string[], startedOn: string | null, today: string) {
  const from = addMonths(today, -NO_SHOW_MONTHS);
  const start = startedOn && startedOn > from ? startedOn : from;
  const held = gatheringDates.filter(d => d > from && d >= start && d <= today).length;
  return { attended, held, percent: held ? Math.min(100, Math.round((attended / held) * 100)) : null };
}

/** "12 days ago", "4 months ago": for last seen and last heard from. */
export function ago(day: string | null, today: string): string {
  if (!day) return "never";
  const days = daysBetween(day.slice(0, 10), today);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 45) return `${days} days ago`;
  const months = Math.floor(days / 30.44);
  if (months < 18) return months === 1 ? "1 month ago" : `${months} months ago`;
  return `${Math.floor(days / 365.25)} years ago`;
}

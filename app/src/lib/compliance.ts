export type Recurrence = "once" | "monthly" | "quarterly" | "yearly";
export type DeadlineStatus = "done" | "overdue" | "soon" | "later";

/** The next due date after completing a recurring item; the day is clamped to the month's end (Jan 31 → Feb 28). */
export function nextDue(due: string, recurrence: Recurrence): string | null {
  const months = { once: 0, monthly: 1, quarterly: 3, yearly: 12 }[recurrence];
  if (!months) return null;
  const [y, m, d] = due.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

const days = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

export function deadlineStatus(due: string, today: string, doneOn?: string | null): DeadlineStatus {
  if (doneOn) return "done";
  const left = days(due, today);
  if (left < 0) return "overdue";
  return left <= 30 ? "soon" : "later";
}

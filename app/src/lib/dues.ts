import type { Dues, DuesExemption, SquarePaymentRow } from "../data/types";

export type DuesRow = {
  key: string; name: string; onRoster: boolean; user: string | null; cells: Record<string, Dues | undefined>;
  /** The exemption covering each month, if any. */
  exempt: Record<string, DuesExemption | undefined>;
  /** The member's current or latest exemption, for editing. */
  exemption: DuesExemption | undefined;
};

/** Whether an exemption covers a month ("2026-11-01"). An exemption with no end runs on. */
export const covers = (e: Pick<DuesExemption, "starts_month" | "ends_month">, month: string) =>
  e.starts_month <= month && (!e.ends_month || month <= e.ends_month);

/** Paid, waived or exempt: nothing owed for that month. */
export const settled = (row: DuesRow, month: string) => Boolean(row.cells[month] || row.exempt[month]);

/** Month keys ("2026-11-01"), oldest first, ending with the month that holds `today`. */
export function lastMonths(today: string, count: number): string[] {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
  });
}

/**
 * One row per person: everyone on the club roster, then anyone who paid dues but isn't matched to the roster yet
 * (paid from the app with an account, or at the table under a name), so nobody's payment goes missing.
 */
export function duesGrid(roster: { key: string; name: string }[], dues: Dues[], months: string[], exemptions: DuesExemption[] = []): DuesRow[] {
  const rows = new Map<string, DuesRow>();
  const blank = (key: string, name: string, onRoster: boolean): DuesRow => ({ key, name, onRoster, user: null, cells: {}, exempt: {}, exemption: undefined });
  for (const r of roster) rows.set(r.key, blank(r.key, r.name, true));
  for (const d of dues) {
    const row = rows.get(d.member_key) ?? blank(d.member_key, d.member_name, false);
    row.user ??= d.member_user;
    if (months.includes(d.month)) row.cells[d.month] = d;
    rows.set(d.member_key, row);
  }
  for (const e of [...exemptions].sort((a, b) => a.starts_month.localeCompare(b.starts_month))) {
    const row = rows.get(e.member_key) ?? blank(e.member_key, e.member_name, false);
    for (const m of months) if (covers(e, m)) row.exempt[m] = e;
    row.exemption = e;
    rows.set(e.member_key, row);
  }
  return [...rows.values()].sort((a, b) => Number(b.onRoster) - Number(a.onRoster) || a.name.localeCompare(b.name));
}

/** Square dues payments that aren't filed under anyone yet: card-reader dues, or online ones missing a name or month. */
export const unassignedDues = (payments: SquarePaymentRow[], dues: Dues[]) => {
  const filed = new Set(dues.map(d => d.square_payment_id).filter(Boolean));
  return payments.filter(p => (p.kind === "dues" || p.items.some(i => i.kind === "dues")) && p.refunded_cents < p.amount_cents && !filed.has(p.square_payment_id));
};

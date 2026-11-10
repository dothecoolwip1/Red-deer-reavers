import type { Dues, SquarePaymentRow } from "../data/types";

export type DuesRow = { key: string; name: string; onRoster: boolean; user: string | null; cells: Record<string, Dues | undefined> };

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
export function duesGrid(roster: { key: string; name: string }[], dues: Dues[], months: string[]): DuesRow[] {
  const rows = new Map<string, DuesRow>();
  for (const r of roster) rows.set(r.key, { key: r.key, name: r.name, onRoster: true, user: null, cells: {} });
  for (const d of dues) {
    const row = rows.get(d.member_key) ?? { key: d.member_key, name: d.member_name, onRoster: false, user: null, cells: {} };
    row.user ??= d.member_user;
    if (months.includes(d.month)) row.cells[d.month] = d;
    rows.set(d.member_key, row);
  }
  return [...rows.values()].sort((a, b) => Number(b.onRoster) - Number(a.onRoster) || a.name.localeCompare(b.name));
}

/** Square dues payments that aren't filed under anyone yet: card-reader dues, or online ones missing a name or month. */
export const unassignedDues = (payments: SquarePaymentRow[], dues: Dues[]) => {
  const filed = new Set(dues.map(d => d.square_payment_id).filter(Boolean));
  return payments.filter(p => (p.kind === "dues" || p.items.some(i => i.kind === "dues")) && p.refunded_cents < p.amount_cents && !filed.has(p.square_payment_id));
};

type Line = { date: string; description: string; amount_cents: number };

export const transactionKey = (t: Line) =>
  `${t.date}|${t.amount_cents}|${t.description.toLowerCase().replace(/\s+/g, " ").trim()}`;

/** Marks rows that are already in the ledger, or repeat an earlier row of the same import. */
export function markDuplicates<T extends Line>(incoming: T[], existing: Line[]): (T & { duplicate: boolean })[] {
  const seen = new Set(existing.map(transactionKey));
  return incoming.map(row => {
    const key = transactionKey(row);
    const duplicate = seen.has(key);
    seen.add(key);
    return { ...row, duplicate };
  });
}

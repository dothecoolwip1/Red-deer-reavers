type Line = { date: string; description: string; amount_cents: number };

export const transactionKey = (t: Line) =>
  `${t.date}|${t.amount_cents}|${t.description.toLowerCase().replace(/\s+/g, " ").trim()}`;

/**
 * Marks rows that are already in the ledger. Each ledger line matches one imported row at most, so re-importing an export
 * adds nothing, while two identical lines inside one export (two equal payments the same day) both count.
 */
export function markDuplicates<T extends Line>(incoming: T[], existing: Line[]): (T & { duplicate: boolean })[] {
  const available = new Map<string, number>();
  for (const line of existing) available.set(transactionKey(line), (available.get(transactionKey(line)) ?? 0) + 1);
  return incoming.map(row => {
    const key = transactionKey(row);
    const left = available.get(key) ?? 0;
    if (left > 0) available.set(key, left - 1);
    return { ...row, duplicate: left > 0 };
  });
}

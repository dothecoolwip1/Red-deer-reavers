type Line = { date: string; description: string; amount_cents: number };
export type ImportLine = Line & { account: string; category: string | null };

/** A deposit from a payment processor, and the ledger account its payments were recorded in. */
const PROCESSORS: [RegExp, string][] = [[/stripe/i, "Stripe"], [/\bsquare\b|\bsq \*|squareup/i, "Square"]];

/**
 * Square and Stripe payments are recorded in their own "Square" / "Stripe" account when they happen (webhooks). When the
 * processor pays the money out to the bank, the bank CSV shows a deposit; that is a transfer between the club's own
 * accounts, not new income.
 */
export function withPayoutTransfers(lines: Line[], account: string): ImportLine[] {
  return lines.flatMap((line): ImportLine[] => {
    const from = line.amount_cents > 0 ? PROCESSORS.find(([re]) => re.test(line.description))?.[1] : undefined;
    if (from) {
      return [
        { ...line, account, category: "Transfer" },
        { date: line.date, description: `Payout to ${account}`, amount_cents: -line.amount_cents, account: from, category: "Transfer" }
      ];
    }
    return [{ ...line, account, category: null }];
  });
}

export const isTransfer = (t: { category: string | null }) => t.category === "Transfer" || t.category === "Opening balance";

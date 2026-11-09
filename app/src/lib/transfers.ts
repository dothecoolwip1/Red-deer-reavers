type Line = { date: string; description: string; amount_cents: number };
export type ImportLine = Line & { account: string; category: string | null };

/**
 * Stripe payments are recorded in the "Stripe" account when they happen (webhook). When Stripe pays the money out to the
 * bank, the bank CSV shows a deposit; that is a transfer between the club's own accounts, not new income.
 */
export function withStripePayoutTransfers(lines: Line[], account: string): ImportLine[] {
  return lines.flatMap((line): ImportLine[] => {
    if (line.amount_cents > 0 && /stripe/i.test(line.description)) {
      return [
        { ...line, account, category: "Transfer" },
        { date: line.date, description: `Payout to ${account}`, amount_cents: -line.amount_cents, account: "Stripe", category: "Transfer" }
      ];
    }
    return [{ ...line, account, category: null }];
  });
}

export const isTransfer = (t: { category: string | null }) => t.category === "Transfer" || t.category === "Opening balance";

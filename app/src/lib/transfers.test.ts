import { describe, expect, it } from "vitest";
import { isTransfer, withStripePayoutTransfers } from "./transfers";

describe("withStripePayoutTransfers", () => {
  it("turns a Stripe payout deposit into a transfer out of the Stripe account, so income is not counted twice", () => {
    const out = withStripePayoutTransfers([
      { date: "2026-11-05", description: "STRIPE PAYOUT", amount_cents: 23100 },
      { date: "2026-11-05", description: "Gym rent", amount_cents: -40000 }
    ], "Chequing");
    expect(out).toEqual([
      { date: "2026-11-05", description: "STRIPE PAYOUT", amount_cents: 23100, account: "Chequing", category: "Transfer" },
      { date: "2026-11-05", description: "Payout to Chequing", amount_cents: -23100, account: "Stripe", category: "Transfer" },
      { date: "2026-11-05", description: "Gym rent", amount_cents: -40000, account: "Chequing", category: null }
    ]);
  });
});

describe("isTransfer", () => {
  it("leaves transfers out of money in and out", () => {
    expect(isTransfer({ category: "Transfer" })).toBe(true);
    expect(isTransfer({ category: "Dues" })).toBe(false);
  });
});

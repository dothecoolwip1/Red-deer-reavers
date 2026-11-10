import { describe, expect, it } from "vitest";
import { isTransfer, withPayoutTransfers } from "./transfers";

describe("withPayoutTransfers", () => {
  it("turns a Stripe payout deposit into a transfer out of the Stripe account, so income is not counted twice", () => {
    const out = withPayoutTransfers([
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

describe("Square payouts", () => {
  it("books a Square deposit as a transfer out of the Square account, but not a purchase that mentions square", () => {
    const out = withPayoutTransfers([
      { date: "2026-11-09", description: "SQUARE CANADA TRANSFER", amount_cents: 9612 },
      { date: "2026-11-09", description: "Square One Hardware", amount_cents: -2500 }
    ], "Chequing");
    expect(out.map(l => [l.account, l.amount_cents, l.category])).toEqual([["Chequing", 9612, "Transfer"], ["Square", -9612, "Transfer"], ["Chequing", -2500, null]]);
  });
});

describe("isTransfer", () => {
  it("leaves transfers out of money in and out", () => {
    expect(isTransfer({ category: "Transfer" })).toBe(true);
    expect(isTransfer({ category: "Dues" })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { checkoutFailure, checkoutProblem, duesKey, kindOf, ledgerLines, paymentLinkBody, paymentRecord, splitByKind, squareSignature, validSignature } from "./square";

const known = [{ title: "Visitor fee", kind: "visitor" }, { title: "Reavers sticker", kind: "sticker" }];

describe("kindOf", () => {
  it("trusts the kind an app checkout put on the line", () => expect(kindOf("Anything", "dues")).toBe("dues"));
  it("matches a card-reader item to the club's item by name", () => expect(kindOf("  visitor FEE ", undefined, known)).toBe("visitor"));
  it("falls back to keywords", () => {
    expect(kindOf("Spring Melee registration")).toBe("tournament");
    expect(kindOf("Spectator admission")).toBe("visitor");
    expect(kindOf("Holo decal")).toBe("sticker");
    expect(kindOf("Fighter trading cards (pack)")).toBe("trading_card");
    expect(kindOf("November dues")).toBe("dues");
    expect(kindOf("Custom amount")).toBe("other");
  });
});

const payment = {
  id: "PAY1", status: "COMPLETED", created_at: "2026-11-08T19:00:00Z", order_id: "ORD1",
  total_money: { amount: 1700, currency: "CAD" }, processing_fee: [{ amount_money: { amount: 49, currency: "CAD" } }],
  receipt_url: "https://squareup.com/receipt/preview/PAY1"
};
const readerOrder = {
  id: "ORD1",
  line_items: [
    { name: "Reavers sticker", quantity: "3", total_money: { amount: 900 } },
    { name: "Fighter trading cards", quantity: "1", total_money: { amount: 500 } }
  ]
};

describe("paymentRecord", () => {
  it("files a card-reader sale with its items, kinds and fee", () => {
    const r = paymentRecord(payment, readerOrder, known);
    expect(r).toMatchObject({
      square_payment_id: "PAY1", square_order_id: "ORD1", amount_cents: 1700, fee_cents: 49, kind: "mixed", channel: "in_person",
      summary: "3 × Reavers sticker, Fighter trading cards", member_user: null, dues_month: null
    });
    expect(r.items.map(i => i.kind)).toEqual(["sticker", "trading_card"]);
  });
  it("reads who and which month from an app dues checkout", () => {
    const r = paymentRecord({ ...payment, total_money: { amount: 3000 }, buyer_email_address: "sam@example.com" }, {
      id: "ORD1", metadata: { reavers_kind: "dues", buyer_name: "Sam Smith", user_id: "00000000-0000-0000-0000-000000000004", dues_month: "2026-11" },
      line_items: [{ name: "Monthly dues (November 2026)", quantity: "1", total_money: { amount: 3000 }, metadata: { reavers_kind: "dues" } }]
    });
    expect(r).toMatchObject({ kind: "dues", channel: "online", buyer_name: "Sam Smith", buyer_email: "sam@example.com", member_user: "00000000-0000-0000-0000-000000000004", dues_month: "2026-11-01" });
  });
  it("handles a quick custom amount with no order", () => {
    const r = paymentRecord({ ...payment, order_id: null, note: "Gate" }, null);
    expect(r.items).toEqual([{ name: "Gate", quantity: 1, amount_cents: 1700, kind: "visitor" }]);
  });
});

describe("splitByKind and ledgerLines", () => {
  it("puts a tip on the largest kind so the ledger adds up to what Square took", () => {
    const items = paymentRecord(payment, readerOrder, known).items;
    expect(splitByKind(items, 1600)).toEqual([{ kind: "sticker", amount_cents: 1100 }, { kind: "trading_card", amount_cents: 500 }]);
  });
  it("books income per kind plus the fee in the Square account, with ids that make retries harmless", () => {
    const lines = ledgerLines(paymentRecord({ ...payment, total_money: { amount: 1400 } }, readerOrder, known));
    expect(lines.map(l => [l.category, l.amount_cents, l.external_id])).toEqual([
      ["Merch", 900, "square-PAY1-sticker"], ["Merch", 500, "square-PAY1-trading_card"], ["Fees", -49, "square-PAY1-fee"]
    ]);
    expect(lines.reduce((s, l) => s + l.amount_cents, 0)).toBe(1400 - 49);
    expect(new Set(lines.map(l => l.account))).toEqual(new Set(["Square"]));
  });
});

describe("duesKey", () => {
  const base = { member_user: null, buyer_name: null, buyer_email: null, square_payment_id: "P" };
  it("reuses the person's earlier key, so a merged member stays merged", () => expect(duesKey({ ...base, member_user: "u" }, "membership:42")).toBe("membership:42"));
  it("keys by account, then name", () => {
    expect(duesKey({ ...base, member_user: "u" })).toBe("user:u");
    expect(duesKey({ ...base, buyer_name: "  Sam  Smith " })).toBe("name:sam smith");
  });
});

describe("webhook signature", () => {
  it("matches Square's HMAC-SHA256 of URL + body, base64", async () => {
    const url = "https://api-home.buhurtoshome.app/functions/v1/reavers-square-webhook";
    const body = '{"type":"payment.updated"}';
    const expected = "UM5a/ON6Ms1PrwfV9l4/CD0NdqOPGrhWJxVF1Um9/Bs="; // computed independently with Python hmac
    expect(await squareSignature("KEY", url, body)).toBe(expected);
    expect(await validSignature("KEY", url, body, expected)).toBe(true);
    expect(await validSignature("KEY", url, body + " ", expected)).toBe(false);
    expect(await validSignature("KEY", url, body, null)).toBe(false);
  });
});

describe("checkout", () => {
  const item = { id: "11111111-1111-1111-1111-111111111111", title: "Monthly dues", kind: "dues", price_cents: 3000, max_quantity: 1 };
  const req = { quantity: 1, buyer_name: "Sam", buyer_email: "sam@example.com", dues_month: "2026-11", user_id: "u1", return_url: "https://app.reddeerreavers.com/#/pay?paid=1" };
  it("asks for what is missing", () => {
    expect(checkoutProblem(item, req)).toBeNull();
    expect(checkoutProblem(item, { ...req, dues_month: null })).toMatch(/month/);
    expect(checkoutProblem(item, { ...req, quantity: 2 })).toMatch(/between 1 and 1/);
    expect(checkoutProblem(item, { ...req, buyer_email: "nope" })).toMatch(/email/);
    expect(checkoutProblem(item, { ...req, return_url: "https://evil.example" })).toBeNull(); // the function, not this check, picks allowed origins
  });
  it("builds a payment link that carries the kind, month and member for the webhook", () => {
    const b = paymentLinkBody(item, req, "LOC", "idem");
    expect(b.order.line_items[0]).toMatchObject({ name: "Monthly dues (November 2026)", quantity: "1", base_price_money: { amount: 3000, currency: "CAD" } });
    expect(b.order.metadata).toEqual({ reavers_kind: "dues", reavers_item: item.id, buyer_name: "Sam", user_id: "u1", dues_month: "2026-11" });
    expect(b.checkout_options.redirect_url).toBe(req.return_url);
  });
});

describe("checkoutFailure", () => {
  it("gives the buyer a 422 they can act on when Square refuses what they typed", () => {
    expect(checkoutFailure(400, [{ category: "INVALID_REQUEST_ERROR", code: "INVALID_EMAIL_ADDRESS", field: "pre_populated_data.buyer_email" }]))
      .toEqual({ status: 422, error: "Square didn't accept that email address. Check it and try again." });
    expect(checkoutFailure(400, [{ category: "INVALID_REQUEST_ERROR", code: "INVALID_VALUE", field: "order.line_items[0].quantity" }]).status).toBe(422);
  });
  it("keeps 502 for outages, bad credentials and rate limits", () => {
    for (const s of [500, 503, 401, 403, 429]) expect(checkoutFailure(s, [{ category: "API_ERROR" }]).status).toBe(502);
    expect(checkoutFailure(200, undefined).status).toBe(502); // answered OK but without a link
  });
});

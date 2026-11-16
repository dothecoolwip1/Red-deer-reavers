import { describe, expect, it } from "vitest";
import { registrationTotals, returnUrlFor, signupPaymentLinkBody, signupProblem, type SignupRequest, type SignupTicket } from "./events";
import { paymentRecord, ledgerLines } from "./square";
import { parseEventsHash } from "../pages/Events";

const fighter: SignupTicket = { id: "t1", title: "Fighter registration", kind: "tournament", price_cents: 4000, max_per_order: 1 };
const volunteer: SignupTicket = { id: "t2", title: "Volunteer", kind: "other", price_cents: 0, max_per_order: 1 };
const event = { id: "s1", event_id: "ev-1", title: "Winter Brawl", event_date: "2026-12-05", ask_phone: false, ask_club: true };
const req = (over: Partial<SignupRequest> = {}): SignupRequest =>
  ({ ticket_id: "t1", quantity: 1, name: "Riley Hart", email: "riley@example.com", return_url: "https://app.reddeerreavers.com/#/events/ev-1", ...over });

describe("signupProblem", () => {
  it("accepts a normal paid sign-up", () => expect(signupProblem(fighter, event, req())).toBeNull());
  it("needs an email for a paid ticket, not for a free one", () => {
    expect(signupProblem(fighter, event, req({ email: "" }))).toMatch(/email/);
    expect(signupProblem(volunteer, event, req({ email: "" }))).toBeNull();
    expect(signupProblem(volunteer, event, req({ email: "nope" }))).toMatch(/doesn't look right/);
  });
  it("keeps to the most per sign-up", () => expect(signupProblem(fighter, event, req({ quantity: 2 }))).toMatch(/between 1 and 1/));
  it("asks for a phone only when the event wants one", () => {
    expect(signupProblem(fighter, { ask_phone: true }, req())).toMatch(/phone/);
    expect(signupProblem(fighter, { ask_phone: true }, req({ phone: "403-555-0100" }))).toBeNull();
  });
  it("refuses odd return addresses", () => expect(signupProblem(fighter, event, req({ return_url: "javascript:alert(1)" }))).toMatch(/return/));
});

describe("returnUrlFor", () => {
  it("brings the buyer back to the event page with their registration", () =>
    expect(returnUrlFor("https://app.reddeerreavers.com/#/events/ev-1", "r-9")).toBe("https://app.reddeerreavers.com/#/events/ev-1?done=r-9"));
  it("drops an older done", () =>
    expect(returnUrlFor("https://reddeerreavers.com/app/#/events/ev-1?done=old", "new")).toBe("https://reddeerreavers.com/app/#/events/ev-1?done=new"));
  it("is read back by the event page", () => expect(parseEventsHash("#/events/ev-1?done=r-9")).toEqual({ eventId: "ev-1", done: "r-9" }));
});

describe("signupPaymentLinkBody", () => {
  const body = signupPaymentLinkBody(fighter, event, { id: "reg-1", quantity: 1, name: " Riley Hart ", email: "riley@example.com" }, "https://x/#/events/ev-1?done=reg-1", "LOC", "reg-1");
  it("tags the order so the webhook books it as event entry and finds the registration", () => {
    expect(body.order.metadata).toMatchObject({ reavers_kind: "tournament", reavers_registration: "reg-1", buyer_name: "Riley Hart" });
    expect(body.order.line_items[0]).toMatchObject({ quantity: "1", base_price_money: { amount: 4000, currency: "CAD" } });
    expect(body.order.line_items[0].name).toBe("Fighter registration: Winter Brawl (Dec 5, 2026)");
  });
  it("lands in the ledger under Event entry", () => {
    const rec = paymentRecord(
      { id: "p1", status: "COMPLETED", created_at: "2026-11-20T18:00:00Z", order_id: "o1", total_money: { amount: 4000 } },
      { id: "o1", metadata: body.order.metadata, line_items: [{ ...body.order.line_items[0], total_money: { amount: 4000 } }] });
    expect(rec.kind).toBe("tournament");
    expect(rec.channel).toBe("online");
    expect(ledgerLines(rec)[0]).toMatchObject({ category: "Event entry", amount_cents: 4000, description: "Square: Tournament registration from Riley Hart" });
  });
});

describe("registrationTotals", () => {
  const r = (status: string, quantity: number, amount_cents: number, paid_via: string | null = "square", checked = false) =>
    ({ status, quantity, amount_cents, ticket_id: "t", ticket_title: amount_cents ? "Visitor" : "Volunteer", checked_in_at: checked ? "2026-12-05T10:00:00Z" : null, paid_via });
  it("counts people coming and money by where it came from", () => {
    const t = registrationTotals([r("paid", 3, 3000, "square", true), r("paid", 1, 1000, "cash"), r("free", 1, 0, null), r("pending", 2, 2000), r("cancelled", 1, 1000)]);
    expect(t).toMatchObject({ people: 5, checkedIn: 3, squareCents: 3000, doorCents: 1000, pending: 1 });
    expect(t.byTicket).toEqual([{ title: "Visitor", people: 4 }, { title: "Volunteer", people: 1 }]);
  });
});

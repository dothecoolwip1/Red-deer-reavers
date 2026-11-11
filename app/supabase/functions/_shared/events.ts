// Event sign-up logic shared by the reavers-event-signup function and the app (tested from app/src/lib/events.test.ts).
// No Deno- or Node-only APIs here: plain data only.

export type TicketKind = "tournament" | "visitor" | "other";
export const TICKET_KINDS: TicketKind[] = ["tournament", "visitor", "other"];
export const TICKET_KIND_LABEL: Record<TicketKind, string> = { tournament: "Fighter registration", visitor: "Visitor / spectator", other: "Other" };

export type SignupRequest = {
  ticket_id: string; quantity: number; name: string; email: string; phone?: string | null; club?: string | null; note?: string | null;
  return_url: string;
};
export type SignupTicket = { id: string; title: string; kind: TicketKind; price_cents: number; max_per_order: number };
export type SignupEvent = { id: string; event_id: string; title: string; event_date: string; ask_phone: boolean; ask_club: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks what someone typed on the sign-up form; returns what is wrong, in words for them, or null. */
export function signupProblem(t: SignupTicket, e: Pick<SignupEvent, "ask_phone">, r: SignupRequest): string | null {
  if (!Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > t.max_per_order) return `Pick between 1 and ${t.max_per_order}.`;
  if (!r.name?.trim() || r.name.length > 120) return "Enter your name.";
  // A free sign-up can skip the email, unless it's the only way to reach them; a paid one needs it for Square's receipt.
  const email = (r.email || "").trim();
  if (t.price_cents > 0 || email) {
    if (!EMAIL.test(email) || email.length > 200) return t.price_cents > 0 ? "Enter an email address for the receipt." : "That email address doesn't look right.";
  }
  if (e.ask_phone && !(r.phone || "").trim()) return "Enter a phone number.";
  if ((r.phone || "").length > 40) return "That phone number is too long.";
  if ((r.club || "").length > 120) return "That club name is too long.";
  if ((r.note || "").length > 1000) return "Keep the note under 1000 characters.";
  if (!/^https:\/\/|^http:\/\/localhost[:/]/.test(r.return_url || "")) return "Bad return address.";
  return null;
}

/** Where Square sends the buyer back to: the event's sign-up page, saying how their registration stands. */
export function returnUrlFor(base: string, registrationId: string): string {
  const [page, hash = ""] = base.split("#");
  const path = hash.split("?")[0] || "/events";
  return `${page}#${path}?done=${encodeURIComponent(registrationId)}`;
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

/**
 * The CreatePaymentLink request body for a registration. The order carries reavers_kind so the webhook books it as event
 * entry or admissions, and reavers_registration so the registration can be found again. Amounts in cents, CAD.
 */
export function signupPaymentLinkBody(
  t: SignupTicket, e: SignupEvent, reg: { id: string; quantity: number; name: string; email: string }, returnUrl: string,
  locationId: string, idempotencyKey: string, currency = "CAD"
) {
  const label = `${t.title}: ${e.title} (${dateLabel(e.event_date)})`;
  return {
    idempotency_key: idempotencyKey,
    order: {
      location_id: locationId,
      reference_id: reg.id.slice(0, 40),
      metadata: { reavers_kind: t.kind, reavers_registration: reg.id, reavers_event: e.event_id.slice(0, 100), buyer_name: reg.name.trim().slice(0, 120) },
      line_items: [{
        name: label.slice(0, 500),
        quantity: String(reg.quantity),
        base_price_money: { amount: t.price_cents, currency },
        metadata: { reavers_kind: t.kind, reavers_ticket: t.id }
      }]
    },
    checkout_options: { redirect_url: returnUrl, ask_for_shipping_address: false },
    pre_populated_data: { buyer_email: reg.email.trim() },
    payment_note: `${label}: ${reg.name.trim()}`.slice(0, 500)
  };
}

// ------------------------------------------------------------------ the app's lists

export type RegistrationStatus = "pending" | "paid" | "free" | "cancelled" | "refunded";
export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Waiting on payment", paid: "Paid", free: "Signed up", cancelled: "Cancelled", refunded: "Refunded"
};
/** Registrations that count as coming. Pending ones older than 45 minutes stop holding a spot (the database agrees). */
export const isComing = (r: { status: string }) => r.status === "paid" || r.status === "free";

export type RegistrationRow = { status: string; quantity: number; amount_cents: number; ticket_id: string | null; ticket_title: string; checked_in_at: string | null; paid_via: string | null };

/** Totals for one event: people coming, money taken (Square and the door separately), checked in, waiting on payment. */
export function registrationTotals(rows: RegistrationRow[]) {
  const coming = rows.filter(isComing);
  const sum = (list: RegistrationRow[], f: (r: RegistrationRow) => number) => list.reduce((s, r) => s + f(r), 0);
  return {
    people: sum(coming, r => r.quantity),
    checkedIn: sum(coming.filter(r => r.checked_in_at), r => r.quantity),
    squareCents: sum(coming.filter(r => r.status === "paid" && r.paid_via === "square"), r => r.amount_cents),
    doorCents: sum(coming.filter(r => r.status === "paid" && r.paid_via !== "square"), r => r.amount_cents),
    pending: rows.filter(r => r.status === "pending").length,
    byTicket: [...coming.reduce((m, r) => m.set(r.ticket_title, (m.get(r.ticket_title) || 0) + r.quantity), new Map<string, number>())]
      .map(([title, people]) => ({ title, people }))
  };
}

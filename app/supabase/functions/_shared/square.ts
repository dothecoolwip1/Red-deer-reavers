// Square logic shared by the reavers-square-* functions and the app (and tested from app/src/lib/square.test.ts).
// No Deno- or Node-only APIs here: Web Crypto and plain data only.

export const KINDS = ["tournament", "visitor", "sticker", "trading_card", "dues", "other"] as const;
export type Kind = (typeof KINDS)[number];
export type PaymentKind = Kind | "mixed";

export const KIND_LABEL: Record<PaymentKind, string> = {
  tournament: "Tournament registration", visitor: "Event visitor fee", sticker: "Stickers", trading_card: "Trading cards",
  dues: "Monthly dues", other: "Other", mixed: "Several things"
};

/** The ledger category each kind is booked under (from the app's category list). */
export const LEDGER_CATEGORY: Record<Kind, string> = {
  tournament: "Event entry", visitor: "Admissions", sticker: "Merch", trading_card: "Merch", dues: "Dues", other: "Other"
};

export const isKind = (v: unknown): v is Kind => typeof v === "string" && (KINDS as readonly string[]).includes(v);

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * What a Square line item is for. Online checkouts from the app carry the kind in the line's metadata. Sales rung up on the
 * card reader carry only the item's name, so it is matched against the club's items in the app, then by keywords.
 */
export function kindOf(name: string, metadataKind?: unknown, known: { title: string; kind: string }[] = []): Kind {
  if (isKind(metadataKind)) return metadataKind;
  const n = norm(name || "");
  const hit = known.find(k => norm(k.title) === n);
  if (hit && isKind(hit.kind)) return hit.kind;
  if (/\bdues\b|\bmembership\b|\bmonthly\b/.test(n)) return "dues";
  if (/tournament|registration|\bregister\b|fighter entry/.test(n)) return "tournament";
  if (/visitor|spectator|admission|\bgate\b|\bdoor\b|\bentry\b|ticket/.test(n)) return "visitor";
  if (/sticker|decal/.test(n)) return "sticker";
  if (/trading card|\bcards?\b|booster/.test(n)) return "trading_card";
  return "other";
}

export type Money = { amount?: number | string | null; currency?: string | null } | null | undefined;
const cents = (m: Money) => Number(m?.amount ?? 0) || 0;

export type SquarePayment = {
  id: string; status: string; created_at: string; updated_at?: string; order_id?: string | null;
  amount_money?: Money; total_money?: Money; tip_money?: Money; processing_fee?: { amount_money?: Money }[] | null;
  buyer_email_address?: string | null; receipt_url?: string | null; source_type?: string | null; note?: string | null;
  card_details?: { entry_method?: string | null } | null;
  billing_address?: { first_name?: string | null; last_name?: string | null } | null;
  shipping_address?: { first_name?: string | null; last_name?: string | null } | null;
};
export type SquareOrder = {
  id: string; source?: { name?: string | null } | null; metadata?: Record<string, string> | null;
  line_items?: { name?: string | null; quantity?: string | null; total_money?: Money; base_price_money?: Money; metadata?: Record<string, string> | null; variation_name?: string | null }[] | null;
};

export type PaymentItem = { name: string; quantity: number; amount_cents: number; kind: Kind };
export type PaymentRecord = {
  square_payment_id: string; square_order_id: string | null; paid_at: string; status: string;
  amount_cents: number; fee_cents: number; kind: PaymentKind; summary: string; items: PaymentItem[];
  channel: "online" | "in_person"; buyer_name: string | null; buyer_email: string | null;
  member_user: string | null; dues_month: string | null; receipt_url: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Turns a completed Square payment (and its order, when it has one) into the row the app keeps. */
export function paymentRecord(p: SquarePayment, order: SquareOrder | null, known: { title: string; kind: string }[] = []): PaymentRecord {
  const total = cents(p.total_money) || cents(p.amount_money);
  const meta = order?.metadata || {};
  const lines = (order?.line_items || []).map(l => {
    const name = [l.name || "Item", l.variation_name && l.variation_name !== "Regular" ? l.variation_name : ""].filter(Boolean).join(", ");
    return { name, quantity: Math.max(1, Math.round(Number(l.quantity || 1))), amount_cents: cents(l.total_money) || cents(l.base_price_money) * Number(l.quantity || 1), kind: kindOf(l.name || "", l.metadata?.reavers_kind ?? meta.reavers_kind, known) };
  });
  const items: PaymentItem[] = lines.length ? lines : [{ name: p.note || "Custom amount", quantity: 1, amount_cents: total, kind: kindOf(p.note || "", meta.reavers_kind, known) }];
  const kinds = [...new Set(items.map(i => i.kind))];
  const person = p.billing_address || p.shipping_address;
  const fromAddress = [person?.first_name, person?.last_name].filter(Boolean).join(" ");
  const online = Boolean(meta.reavers_kind) || /online|checkout/i.test(order?.source?.name || "") || p.source_type === "WALLET" || p.card_details?.entry_method === "KEYED" || p.card_details?.entry_method === "ON_FILE";
  return {
    square_payment_id: p.id,
    square_order_id: p.order_id || order?.id || null,
    paid_at: p.updated_at || p.created_at,
    status: p.status,
    amount_cents: total,
    fee_cents: (p.processing_fee || []).reduce((s, f) => s + cents(f.amount_money), 0),
    kind: kinds.length === 1 ? kinds[0] : "mixed",
    summary: items.map(i => (i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name)).join(", ").slice(0, 300),
    items,
    channel: online ? "online" : "in_person",
    buyer_name: (meta.buyer_name || fromAddress || "").slice(0, 120) || null,
    buyer_email: p.buyer_email_address || null,
    member_user: UUID.test(meta.user_id || "") ? meta.user_id : null,
    dues_month: MONTH.test(meta.dues_month || "") ? `${meta.dues_month}-01` : null,
    receipt_url: p.receipt_url || null
  };
}

/**
 * Splits what was paid into one ledger amount per kind. Line totals are used as they are; anything left over (a tip, or
 * rounding) goes to the largest kind, so the ledger always adds up to what Square took.
 */
export function splitByKind(items: PaymentItem[], total: number): { kind: Kind; amount_cents: number }[] {
  const by = new Map<Kind, number>();
  for (const i of items) by.set(i.kind, (by.get(i.kind) || 0) + i.amount_cents);
  if (by.size === 0) return [{ kind: "other", amount_cents: total }];
  if (by.size === 1) return [{ kind: [...by.keys()][0], amount_cents: total }];
  const out = [...by.entries()].map(([kind, amount_cents]) => ({ kind, amount_cents }));
  const biggest = out.reduce((a, b) => (b.amount_cents > a.amount_cents ? b : a));
  biggest.amount_cents += total - out.reduce((s, x) => s + x.amount_cents, 0);
  return out;
}

/** Ledger lines for a payment: income per kind, then Square's fee as money out, all in the "Square" account. */
export function ledgerLines(r: PaymentRecord) {
  const date = r.paid_at.slice(0, 10);
  const who = r.buyer_name || r.buyer_email || (r.channel === "in_person" ? "card reader" : "Square customer");
  const income = splitByKind(r.items, r.amount_cents).map(s => ({
    date, description: `Square: ${KIND_LABEL[s.kind]} from ${who}`, amount_cents: s.amount_cents, category: LEDGER_CATEGORY[s.kind],
    account: "Square", notes: r.summary || null, source: "square" as const, external_id: `square-${r.square_payment_id}-${s.kind}`
  }));
  const fee = r.fee_cents > 0 ? [{
    date, description: "Square processing fee", amount_cents: -r.fee_cents, category: "Fees", account: "Square",
    notes: r.summary || null, source: "square" as const, external_id: `square-${r.square_payment_id}-fee`
  }] : [];
  return [...income, ...fee];
}

/** How a dues payment is filed: under the person it was already filed under before, or a new key for them. */
export function duesKey(r: Pick<PaymentRecord, "member_user" | "buyer_name" | "buyer_email" | "square_payment_id">, existingKeyForUser?: string | null): string {
  if (existingKeyForUser) return existingKeyForUser;
  if (r.member_user) return `user:${r.member_user}`;
  const name = norm(r.buyer_name || r.buyer_email || "");
  return name ? `name:${name}` : `payment:${r.square_payment_id}`;
}

// ------------------------------------------------------------------ webhook signature

const enc = new TextEncoder();
function b64(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

/** Square signs each notification: base64(HMAC-SHA256(signature key, notification URL + raw body)). */
export async function squareSignature(signatureKey: string, notificationUrl: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(signatureKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(notificationUrl + body)));
}

export async function validSignature(signatureKey: string, notificationUrl: string, body: string, header: string | null): Promise<boolean> {
  if (!header || !signatureKey) return false;
  const expected = await squareSignature(signatureKey, notificationUrl, body);
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

// ------------------------------------------------------------------ checkout

export type CheckoutItem = { id: string; title: string; kind: string; price_cents: number; max_quantity: number };
export type CheckoutRequest = { quantity: number; buyer_name: string; buyer_email: string; dues_month?: string | null; user_id?: string | null; return_url: string };

export const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym.slice(0, 7)}-01T12:00:00Z`));

/** Checks a checkout request; returns what is wrong, in words for the buyer, or null. */
export function checkoutProblem(item: CheckoutItem, r: CheckoutRequest): string | null {
  if (!Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > item.max_quantity) return `Pick between 1 and ${item.max_quantity}.`;
  if (!r.buyer_name?.trim() || r.buyer_name.length > 120) return "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.buyer_email || "") || r.buyer_email.length > 200) return "Enter an email address for the receipt.";
  if (item.kind === "dues" && !MONTH.test(r.dues_month || "")) return "Pick the month these dues are for.";
  if (!/^https:\/\/|^http:\/\/localhost[:/]/.test(r.return_url || "")) return "Bad return address.";
  return null;
}

/** The CreatePaymentLink request body for one item. Amounts are in cents, Canadian dollars. */
export function paymentLinkBody(item: CheckoutItem, r: CheckoutRequest, locationId: string, idempotencyKey: string, currency = "CAD") {
  const forMonth = item.kind === "dues" && r.dues_month ? ` (${monthLabel(r.dues_month)})` : "";
  const meta: Record<string, string> = { reavers_kind: item.kind, reavers_item: item.id, buyer_name: r.buyer_name.trim().slice(0, 120) };
  if (r.user_id) meta.user_id = r.user_id;
  if (item.kind === "dues" && r.dues_month) meta.dues_month = r.dues_month.slice(0, 7);
  return {
    idempotency_key: idempotencyKey,
    order: {
      location_id: locationId,
      reference_id: item.id.slice(0, 40),
      metadata: meta,
      line_items: [{
        name: `${item.title}${forMonth}`.slice(0, 500),
        quantity: String(r.quantity),
        base_price_money: { amount: item.price_cents, currency },
        metadata: { reavers_kind: item.kind, reavers_item: item.id }
      }]
    },
    checkout_options: { redirect_url: r.return_url, ask_for_shipping_address: false },
    pre_populated_data: { buyer_email: r.buyer_email.trim() },
    payment_note: `${item.title}${forMonth}: ${r.buyer_name.trim()}`.slice(0, 500)
  };
}

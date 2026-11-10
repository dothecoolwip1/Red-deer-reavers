// Records every completed Square payment (online checkouts and card-reader sales) in the Reavers app: the Square sales
// list, the ledger ("Square" account, with Square's fee as its own line) and, for dues, the dues table. Refunds too.
// Square signs its own requests, so this function must be reachable without a Supabase sign-in (see app/README.md).
// Secrets: SQUARE_ACCESS_TOKEN, SQUARE_WEBHOOK_SIGNATURE_KEY, SQUARE_WEBHOOK_URL (the exact notification URL entered in
// Square), optional SQUARE_ENVIRONMENT=sandbox and SQUARE_VERSION.
// Square events to subscribe to: payment.created, payment.updated, refund.created, refund.updated.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { duesKey, ledgerLines, paymentRecord, validSignature, type SquareOrder, type SquarePayment } from "../_shared/square.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
const SQUARE_API = Deno.env.get("SQUARE_ENVIRONMENT") === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

async function square<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SQUARE_API}${path}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN") ?? ""}`, "Square-Version": Deno.env.get("SQUARE_VERSION") ?? "2026-09-16" }
  });
  if (!res.ok) { console.error("Square read failed", path, res.status, await res.text()); return null; }
  return await res.json() as T;
}

const fail = (what: string, message: string) => new Response(`${what}: ${message}`, { status: 500 }); // Square retries on 5xx

async function recordPayment(p: SquarePayment): Promise<Response> {
  if (p.status !== "COMPLETED") return new Response("Not completed yet", { status: 200 });
  const order = p.order_id ? (await square<{ order: SquareOrder }>(`/v2/orders/${encodeURIComponent(p.order_id)}`))?.order ?? null : null;
  if (p.order_id && !order) return fail("Order read", p.order_id);
  const { data: known } = await db.from("reavers_app_square_items").select("title,kind");
  const r = paymentRecord(p, order, known || []);

  // Square sends several events per payment. The first completed one files it; later ones only refresh the fee and receipt,
  // so a kind treasury corrected by hand stays corrected.
  const { data: existing } = await db.from("reavers_app_square_payments").select("id").eq("square_payment_id", r.square_payment_id).maybeSingle();
  const saved = existing
    ? await db.from("reavers_app_square_payments").update({ status: r.status, fee_cents: r.fee_cents, receipt_url: r.receipt_url }).eq("id", existing.id)
    : await db.from("reavers_app_square_payments").upsert(r, { onConflict: "square_payment_id", ignoreDuplicates: true });
  if (saved.error) return fail("Payment write", saved.error.message);
  if (existing) {
    // The fee can arrive after the first event; book it once it is known.
    const fee = ledgerLines(r).filter(l => l.external_id.endsWith("-fee"));
    if (fee.length) await db.from("reavers_app_transactions").upsert(fee, { onConflict: "external_id", ignoreDuplicates: true });
    return new Response("Updated", { status: 200 });
  }
  const ledger = await db.from("reavers_app_transactions").upsert(ledgerLines(r), { onConflict: "external_id", ignoreDuplicates: true });
  if (ledger.error) return fail("Ledger write", ledger.error.message);

  // Dues paid from the app say which month and who. Card-reader dues have neither: treasury assigns them on the Dues page.
  if (r.kind === "dues" && r.dues_month && (r.member_user || r.buyer_name)) {
    const prior = r.member_user
      ? (await db.from("reavers_app_dues").select("member_key").eq("member_user", r.member_user).limit(1).maybeSingle()).data?.member_key
      : null;
    const dues = await db.from("reavers_app_dues").upsert({
      member_key: duesKey(r, prior), member_name: r.buyer_name || r.buyer_email || "Square customer", member_user: r.member_user,
      month: r.dues_month, amount_cents: r.amount_cents, method: "square", paid_on: r.paid_at.slice(0, 10), square_payment_id: r.square_payment_id,
      created_by: null
    }, { onConflict: "member_key,month", ignoreDuplicates: true });
    if (dues.error) return fail("Dues write", dues.error.message);
  }
  return new Response("Recorded", { status: 200 });
}

type SquareRefund = { id: string; status: string; payment_id: string; amount_money?: { amount?: number }; created_at: string; updated_at?: string };

async function recordRefund(f: SquareRefund): Promise<Response> {
  if (f.status !== "COMPLETED") return new Response("Refund not completed yet", { status: 200 });
  const { data: pay, error } = await db.from("reavers_app_square_payments").select("id,refunds,summary,buyer_name").eq("square_payment_id", f.payment_id).maybeSingle();
  if (error) return fail("Payment read", error.message);
  const amount = Number(f.amount_money?.amount ?? 0);
  if (pay) {
    const refunds = { ...(pay.refunds as Record<string, number>), [f.id]: amount };
    const total = Object.values(refunds).reduce((s, n) => s + Number(n), 0);
    const up = await db.from("reavers_app_square_payments").update({ refunds, refunded_cents: total }).eq("id", pay.id);
    if (up.error) return fail("Payment update", up.error.message);
  }
  const ledger = await db.from("reavers_app_transactions").upsert({
    date: (f.updated_at || f.created_at).slice(0, 10), description: `Square refund${pay?.buyer_name ? ` to ${pay.buyer_name}` : ""}`,
    amount_cents: -amount, category: "Other", account: "Square", notes: pay?.summary || null, source: "square", external_id: `square-refund-${f.id}`
  }, { onConflict: "external_id", ignoreDuplicates: true });
  if (ledger.error) return fail("Ledger write", ledger.error.message);
  return new Response("Refund recorded", { status: 200 });
}

Deno.serve(async req => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.text();
  const ok = await validSignature(Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY") ?? "", Deno.env.get("SQUARE_WEBHOOK_URL") ?? "", body, req.headers.get("x-square-hmacsha256-signature"));
  if (!ok) return new Response("Bad signature", { status: 401 });

  let event: { type?: string; data?: { object?: { payment?: SquarePayment; refund?: SquareRefund } } };
  try { event = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
  const obj = event.data?.object;
  if ((event.type === "payment.created" || event.type === "payment.updated") && obj?.payment) return await recordPayment(obj.payment);
  if ((event.type === "refund.created" || event.type === "refund.updated") && obj?.refund) return await recordRefund(obj.refund);
  return new Response("Ignored", { status: 200 });
});

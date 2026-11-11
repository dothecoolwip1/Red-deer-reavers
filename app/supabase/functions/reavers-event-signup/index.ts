// Signs someone up for a Reavers event from the public sign-up page (app/#/events/<event>), no account needed.
// Holds their place with reavers_app_event_reserve() (which checks the event is open and not full), then for a paid
// ticket starts a Square checkout and returns its address. A free ticket is confirmed straight away.
// When Square's webhook records the payment, a database trigger marks the registration paid; this function never does.
// Secrets: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, optional SQUARE_ENVIRONMENT=sandbox and SQUARE_VERSION
// (the same ones reavers-square-checkout uses). JWT checks stay on: the page sends the public key when nobody is signed in.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { checkoutFailure } from "../_shared/square.ts";
import { returnUrlFor, signupPaymentLinkBody, signupProblem, type SignupEvent, type SignupRequest, type SignupTicket } from "../_shared/events.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
const SQUARE_API = Deno.env.get("SQUARE_ENVIRONMENT") === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
const ALLOWED = [/^https:\/\/(app\.)?reddeerreavers\.com$/, /^http:\/\/localhost:\d+$/];

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED.some(r => r.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "https://reddeerreavers.com",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  };
}

Deno.serve(async req => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  let body: Partial<SignupRequest>;
  try { body = await req.json(); } catch { return reply(400, { error: "Bad request" }); }

  const { data: ticket, error } = await db.from("reavers_app_event_tickets")
    .select("id,title,kind,price_cents,max_per_order,active,signup_id").eq("id", body.ticket_id ?? "").maybeSingle();
  if (error || !ticket || !ticket.active) return reply(404, { error: "That ticket isn't available any more." });
  const { data: event } = await db.from("reavers_app_event_signups")
    .select("id,event_id,title,event_date,ask_phone,ask_club").eq("id", ticket.signup_id).maybeSingle();
  if (!event) return reply(404, { error: "That event isn't taking sign-ups." });

  const request: SignupRequest = {
    ticket_id: ticket.id, quantity: Number(body.quantity ?? 1), name: String(body.name ?? ""), email: String(body.email ?? ""),
    phone: body.phone ? String(body.phone) : null, club: body.club ? String(body.club) : null, note: body.note ? String(body.note) : null,
    return_url: String(body.return_url ?? "")
  };
  const problem = signupProblem(ticket as SignupTicket, event as SignupEvent, request);
  if (problem) return reply(400, { error: problem });

  // Holds the place (or says the event is closed or full). Free tickets come back already confirmed.
  const { data: reg, error: held } = await db.rpc("reavers_app_event_reserve", {
    p_ticket: ticket.id, p_quantity: request.quantity, p_name: request.name, p_email: request.email,
    p_phone: request.phone, p_club: request.club, p_note: request.note
  });
  if (held || !reg) {
    // The reserve function's own messages (closed, full, sold out) are written for the person signing up.
    const said = held?.code === "P0001" ? held.message : "Couldn't save your sign-up. Try again in a minute.";
    if (held && held.code !== "P0001") console.error("Reserve failed", held.message);
    return reply(held?.code === "P0001" ? 409 : 500, { error: said });
  }
  const returnUrl = returnUrlFor(request.return_url, reg.id);
  if (reg.status === "free") return reply(200, { registration: reg.id, status: "free", url: returnUrl });

  const drop = () => db.from("reavers_app_event_registrations").delete().eq("id", reg.id).eq("status", "pending");
  let res: Response;
  try {
    res = await fetch(`${SQUARE_API}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN") ?? ""}`,
        "Square-Version": Deno.env.get("SQUARE_VERSION") ?? "2026-09-16",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signupPaymentLinkBody(ticket as SignupTicket, event as SignupEvent,
        { id: reg.id, quantity: reg.quantity, name: reg.name, email: request.email }, returnUrl,
        Deno.env.get("SQUARE_LOCATION_ID") ?? "", reg.id))
    });
  } catch (err) {
    console.error("Square unreachable", (err as Error).message);
    await drop();
    return reply(502, { error: "Square didn't start the checkout. Try again in a minute." });
  }
  const out = await res.json().catch(() => ({}));
  const orderId = out.payment_link?.order_id ?? out.related_resources?.orders?.[0]?.id;
  if (!res.ok || !out.payment_link?.url || !orderId) {
    console.error("Square checkout failed", res.status, JSON.stringify(out.errors ?? out));
    await drop();
    const failure = checkoutFailure(res.ok ? 502 : res.status, out.errors);
    return reply(failure.status, { error: failure.error });
  }
  const saved = await db.from("reavers_app_event_registrations").update({ square_order_id: orderId }).eq("id", reg.id);
  if (saved.error) {
    console.error("Order save failed", saved.error.message);
    return reply(500, { error: "Couldn't save your sign-up. Try again in a minute." });
  }
  return reply(200, { registration: reg.id, status: "pending", url: out.payment_link.url });
});

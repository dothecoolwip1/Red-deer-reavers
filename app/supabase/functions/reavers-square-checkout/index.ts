// Starts a Square checkout for one of the club's items (tournament registration, visitor fee, stickers, trading cards,
// monthly dues) and returns the Square payment page address. Called by the app's "Pay the Reavers" page.
// Public items need no sign-in; members-only items (dues) need the member's sign-in, sent as the Authorization header.
// Secrets: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, optional SQUARE_ENVIRONMENT=sandbox and SQUARE_VERSION.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { checkoutFailure, checkoutProblem, paymentLinkBody, type CheckoutItem } from "../_shared/square.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
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

  let body: { item_id?: string; quantity?: number; buyer_name?: string; buyer_email?: string; dues_month?: string; return_url?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Bad request" }); }

  const { data: item, error } = await db.from("reavers_app_square_items")
    .select("id,title,kind,price_cents,max_quantity,public,active").eq("id", body.item_id ?? "").maybeSingle();
  if (error || !item || !item.active) return reply(404, { error: "That item isn't for sale any more." });

  // Who is paying, when signed in. Needed for members-only items, and lets dues file themselves under the right person.
  let userId: string | null = null;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (token) {
    const { data } = await db.auth.getUser(token);
    userId = data.user?.id ?? null;
  }
  if (!item.public) {
    if (!userId) return reply(401, { error: "Sign in to the Reavers app to pay this." });
    const asUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: role } = await asUser.rpc("reavers_app_my_role");
    if (!["finance", "exec", "member"].includes(role)) return reply(403, { error: "This is for Reavers members." });
  }

  const request = {
    quantity: Number(body.quantity ?? 1), buyer_name: String(body.buyer_name ?? ""), buyer_email: String(body.buyer_email ?? ""),
    dues_month: body.dues_month ?? null, user_id: userId, return_url: String(body.return_url ?? "")
  };
  const problem = checkoutProblem(item as CheckoutItem, request);
  if (problem) return reply(400, { error: problem });

  let res: Response;
  try {
    res = await fetch(`${SQUARE_API}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN") ?? ""}`,
        "Square-Version": Deno.env.get("SQUARE_VERSION") ?? "2026-09-16",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentLinkBody(item as CheckoutItem, request, Deno.env.get("SQUARE_LOCATION_ID") ?? "", crypto.randomUUID()))
    });
  } catch (err) {
    console.error("Square unreachable", (err as Error).message);
    return reply(502, { error: "Square didn't start the checkout. Try again in a minute, or pay at the table." });
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.payment_link?.url) {
    console.error("Square checkout failed", res.status, JSON.stringify(out.errors ?? out));
    // A 422 for what the buyer can fix (shown as-is in the app); 502 only for real outages.
    const failure = checkoutFailure(res.ok ? 502 : res.status, out.errors);
    return reply(failure.status, { error: failure.error });
  }
  return reply(200, { url: out.payment_link.url });
});

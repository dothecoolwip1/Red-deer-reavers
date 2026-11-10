// Records every completed Stripe checkout (Payment Links for dues, entry fees, sponsorships, donations, merch) in the
// Reavers ledger. Deploy with JWT verification off, since Stripe signs its own requests:
//   supabase functions deploy reavers-stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
// In Stripe: Developers → Webhooks → Add endpoint → https://<project>.supabase.co/functions/v1/reavers-stripe-webhook,
// event checkout.session.completed. Put a "category" key in each Payment Link's metadata (Dues, Donations, Sponsorship…).
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();
const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false }
});

Deno.serve(async req => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "", undefined, crypto);
  } catch (err) {
    return new Response(`Bad signature: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return new Response("Ignored", { status: 200 });
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid" || !session.amount_total) return new Response("Not paid", { status: 200 });

  const who = session.customer_details?.name || session.customer_details?.email || "Stripe customer";
  const what = session.metadata?.description || session.metadata?.category || "Payment";
  const { error } = await db.from("reavers_app_transactions").upsert({
    date: new Date(event.created * 1000).toISOString().slice(0, 10),
    description: `Stripe: ${what} from ${who}`,
    amount_cents: session.amount_total,              // gross; Stripe's fee shows up when the payout is imported from the bank CSV
    category: session.metadata?.category || null,
    account: "Stripe",
    notes: session.customer_details?.email ? `Paid by ${session.customer_details.email}` : null,
    source: "stripe",
    external_id: event.id
  }, { onConflict: "external_id", ignoreDuplicates: true });

  if (error) return new Response(`Ledger write failed: ${error.message}`, { status: 500 }); // Stripe retries on 5xx
  return new Response("Recorded", { status: 200 });
});

# Reavers app (app.reddeerreavers.com)

The club's back office: member attendance and the 3-month no-show policy, ledger, bank CSV import, receipts, reimbursements, budget, Square payments and monthly dues, sponsors,
grants, waivers, incidents, the armory, a deadlines calendar and a click-to-edit **site editor** for reddeerreavers.com. Design: `docs/superpowers/specs/2026-11-09-reavers-app-design.md`.

People sign in with their BuhurtOS account (Google, Discord or email), the same one as the members area. What they can do
comes from BuhurtOS, so there is nothing new to assign:

| Role | Who | Can |
| --- | --- | --- |
| Treasury | BuhurtOS owner, a Reavers captain, the current president or treasurer | Everything, including the ledger and approving claims |
| Executive | Any other current Reavers officer | Read the money; run sponsors, grants, gear, waivers, incidents, deadlines |
| Member | Anyone on the Reavers team | Sign their waiver, file claims, report incidents, see payment options and their own loans |

The database enforces all of this with row-level security; the screens only hide what someone can't use.

**Page access.** Admins (treasury) can change this per person under Team → **Page access**: give a member a staff page
(say Sponsors, or view-only Ledger), or take one away from an executive. Each money page can be No access, View or Edit;
the other staff pages are No access or Use. Admins always keep every page, and everyone keeps Home, Reimbursements,
Pay the club, Waiver and Incidents. The database applies the same choices to each page's records
(`supabase/migrations/20261111000000_reavers_app_page_access.sql`), so a hidden page can't be read over the API either.
The website pages that save through BuhurtOS (Calendar, Team page, Practices, Inquiries, Site settings) still need a
Reavers captain to save; there, Page access only shows or hides them.

## Run it

```
cd app
npm install
npm run dev        # http://localhost:5173/app/  ("Look around with sample data" needs no sign-in)
npm test           # logic tests
npm run build      # also run by the site's npm run build, which copies it to _site/app/
```

Until the migration below is applied, a signed-in person sees sample data with a banner saying nothing is saved.

## Go live (one-time)

1. **Database.** Done on the home server and the cloud copy on 2026-11-10 (BuhurtOS PR #182 carries the same files). For a
   fresh server, apply the four files in `supabase/migrations/` in name order. They only add `reavers_app_*` tables, a private
   `reavers-app-receipts` bucket, a public `reavers-site-media` bucket, a few functions and the grants signed-in users need
   (BuhurtOS grants nothing by default); nothing existing changes. To check them first against a local Postgres:
   `PGHOST=... PGUSER=postgres supabase/tests/run.sh`.
2. **Domain.** In the Vercel project for reddeerreavers.com, add the domain `app.reddeerreavers.com` and the DNS record
   Vercel asks for. `vercel.json` already serves the app there. It also works at `https://reddeerreavers.com/app/`.
3. **Sign-in redirect.** Add `https://app.reddeerreavers.com/**` to the home server's auth redirect allow-list (next to
   `https://reddeerreavers.com/**`), so Google and Discord sign-in return to the app.
4. **Attendance bot (optional).** Apply `20261110010000_reavers_app_attendance.sql`, then follow
   `docs/attendance-discord-bot.md`.
5. **Your own QR codes.** Apply `20261111010000_reavers_app_qr_codes.sql` (home server and the cloud copy). Until then the
   QR codes page still shows the website codes and says the update is needed before admins can add their own.
6. **Sponsors on the website.** Apply `20261112000000_reavers_app_sponsors_public.sql` (home server and the cloud copy).
   It lets the website's Sponsors page (`sponsors.html`) list signed sponsors switched on under Sponsors → Website, and
   sends its "Become a sponsor" form into the Sponsors pipeline and the Inquiries page. Until then the page shows an
   open "Your logo here" wall and the form says to email instead.
7. **Square.** See "Turn on Square" below.
8. **Stripe (optional, older).** Deploy `supabase/functions/reavers-stripe-webhook` with `--no-verify-jwt`, set
   `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and add the endpoint in Stripe for `checkout.session.completed`.
   Square replaces this; existing Stripe links still show under Pay the club → Other payment links.

## Turn on Square

Square is the club's payment system: tournament registration, event visitor fees, stickers, trading cards and monthly
dues, online and on the card reader at the table. What's in the app:

- **Pay the club** (members) and the **open pay page** at `https://app.reddeerreavers.com/#/buy` (anyone, no account;
  put it on posters and QR codes). Treasury sets what's for sale and the prices under Pay the club → Manage what the club sells.
- **Money → Square sales**: every Square payment, by month, with totals for each kind, fees, refunds and CSV export.
  Treasury can re-label a payment (say a card-reader "Custom amount" that was a visitor fee); its ledger lines follow.
- **Money → Dues**: everyone on the club roster by month. Square dues tick themselves off; treasury marks cash, e-Transfer
  and waived months, files card-reader dues payments under the right person, and can make a member **payment exempt**
  (click their name: a reason, a start month and an optional end month). Exempt months show as "Exempt", not unpaid.
- **Ledger**: each payment lands in the `Square` account (income by kind, plus Square's fee as its own line). When Square
  deposits to the bank, the CSV import books it as a transfer, so nothing is counted twice.

One-time setup (about 20 minutes):

1. **Database.** Apply `supabase/migrations/20261110000000_reavers_app_square.sql` and then
   `20261110020000_reavers_app_dues_exemptions.sql` on the home server (and the cloud copy), like the earlier ones. It adds `reavers_app_square_items`, `reavers_app_square_payments`, `reavers_app_dues` and one
   function, and lets the ledger take `square` lines. Nothing existing changes.
2. **Square app and keys.** Sign in at https://developer.squareup.com/apps with the Reavers Square account →
   **Create an application** (name it "Reavers app") → open it → switch the toggle at the top to **Production** →
   **Credentials**: copy the **Production access token**. Then **Locations** (left menu): copy the **Location ID** of the
   club's location.
3. **Webhook.** In the same application: **Webhooks → Subscriptions → Add subscription** (Production). Name "Reavers app",
   URL `https://api-home.buhurtoshome.app/functions/v1/reavers-square-webhook`, events `payment.created`,
   `payment.updated`, `refund.created`, `refund.updated`. Save, open it and copy the **Signature key**.
4. **Functions on the home server.** Copy `supabase/functions/_shared`, `supabase/functions/reavers-square-checkout` and
   `supabase/functions/reavers-square-webhook` into the server's `volumes/functions/` folder (next to `main`). Add to the
   server's `.env`, and pass them to the `functions` service in `docker-compose.yml` under `environment:`:
   ```
   SQUARE_ACCESS_TOKEN=<production access token>
   SQUARE_LOCATION_ID=<location id>
   SQUARE_WEBHOOK_SIGNATURE_KEY=<signature key>
   SQUARE_WEBHOOK_URL=https://api-home.buhurtoshome.app/functions/v1/reavers-square-webhook
   ```
   Square can't send a Supabase sign-in, so the webhook must be let through without one: if the server has
   `VERIFY_JWT=true`, edit `volumes/functions/main/index.ts` so the JWT check is skipped when the function name is
   `reavers-square-webhook` (the function checks Square's signature itself and refuses anything unsigned). The checkout
   function keeps JWT checks on; the app always sends one. Then `docker compose up -d functions`.
   (On a Supabase cloud project instead: `supabase functions deploy reavers-square-checkout`,
   `supabase functions deploy reavers-square-webhook --no-verify-jwt`, and `supabase secrets set` the four values.)
5. **What you sell.** In the app, Pay the club → Manage what the club sells: add Tournament registration, Event visitor fee,
   Reavers sticker, Fighter trading cards and Monthly dues (members only) with their prices. In the Square app / Square
   Dashboard → Items, create items with **the same names** for the card reader, so table sales are sorted the same way.
6. **Test.** In Square's webhook subscription press **Send test event**: Square should show a 200 reply. Then buy a $3
   sticker on the open pay page with your own card, check it appears in Square sales and the Ledger, and refund it in
   the Square Dashboard (the refund shows too).

**Keep BuhurtOS in step.** The server's copy of the Square functions is deployed from the BuhurtOS repository
(`supabase/functions/`). Whenever `reavers-square-checkout`, `reavers-square-webhook` or `_shared/square.ts` change here,
copy them into BuhurtOS too, or the next BuhurtOS deploy puts the old version back.

To try it without real money first, do steps 2 to 4 with the **Sandbox** toggle instead, add `SQUARE_ENVIRONMENT=sandbox`,
and pay with Square's test card 4111 1111 1111 1111.

## Attendance

Team → Attendance tracks who comes to practices, tournaments, events and fundraisers: how often each member shows up,
when they started, their last practice, and the last time anyone heard from them. **Take attendance** starts a check-in
where you tap everyone who's there. Anyone active and not seen for over 3 months is flagged (on the page, on Home and,
once the bot is set up, in the leadership channel). A captain or executive can mark them away, log that they heard from
them, or start a **removal timer** (14, 30 or 60 days); the Discord bot then messages them asking why, and their answer
shows on their record. When the timer runs out, the executive keeps them or marks them removed. Nothing kicks anyone
automatically. Executive only; the database enforces it. Bot setup: `docs/attendance-discord-bot.md`.

## How money flows

- **Bank:** export the account's CSV from online banking each month and import it in Ledger. Lines already there are
  skipped (each ledger line matches one imported line, so two identical payments on the same day both stay).
- **Square:** each payment is recorded in the `Square` account when it happens, split by what it was for, with Square's
  fee as a separate line. Square's deposits to the bank are booked as transfers by the CSV import, the same as Stripe.
- **Stripe:** each payment is recorded in the `Stripe` account when it happens. When Stripe pays out to the bank, the
  import books that deposit as a transfer (and a matching transfer out of `Stripe`), so income isn't counted twice.
  Transfers and the opening balance are left out of money-in and money-out totals.
- **Reimbursements:** a member files with a receipt photo; treasury approves (two different people over $250, never
  your own) and marks it paid, which writes the expense to the ledger.

## Site editor

Society → Site editor shows a real page of reddeerreavers.com in a frame. Click any text to type over it, or click a
picture to upload a new one; the panel on the right lists everything editable on the page, with search. Changes are
drafts (kept in your browser, with Undo and Discard) until someone presses **Publish**. History shows every published
change with "Restore this version". Desktop, tablet and phone previews show how it looks on each.

How it works: `site-content.js`, loaded on every public page, finds the text and pictures by itself (no markup needed;
each piece is named by its page and a fingerprint of its original wording) and applies what was published from the
`reavers_app_site_content` table, as plain text only. Text filled in live (practices, events, the roster) isn't editable
here; it comes from Team Admin and BuhurtOS. If a developer later rewrites a sentence in the code, the old edit stops
applying and the new wording shows. Only the executive can publish; anyone can read what was published.

Click-to-edit needs this update deployed to reddeerreavers.com, because the editor talks to the script on the page.

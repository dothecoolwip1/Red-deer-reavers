# Reavers app (app.reddeerreavers.com)

The club's back office: ledger, bank CSV import, receipts, reimbursements, budget, Stripe payment links, sponsors,
grants, waivers, incidents, the armory, a deadlines calendar and a click-to-edit **site editor** for reddeerreavers.com. Design: `docs/superpowers/specs/2026-11-09-reavers-app-design.md`.

People sign in with their BuhurtOS account (Google, Discord or email), the same one as the members area. What they can do
comes from BuhurtOS, so there is nothing new to assign:

| Role | Who | Can |
| --- | --- | --- |
| Treasury | BuhurtOS owner, a Reavers captain, the current president or treasurer | Everything, including the ledger and approving claims |
| Executive | Any other current Reavers officer | Read the money; run sponsors, grants, gear, waivers, incidents, deadlines |
| Member | Anyone on the Reavers team | Sign their waiver, file claims, report incidents, see payment options and their own loans |

The database enforces all of this with row-level security; the screens only hide what someone can't use.

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
4. **Stripe (optional).** Deploy `supabase/functions/reavers-stripe-webhook` with `--no-verify-jwt`, set
   `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and add the endpoint in Stripe for `checkout.session.completed`.
   Give each Payment Link a `category` metadata value (Dues, Donations, Sponsorship…), then add the links under
   Pay the club → Manage payment links.

## How money flows

- **Bank:** export the account's CSV from online banking each month and import it in Ledger. Lines already there are
  skipped (each ledger line matches one imported line, so two identical payments on the same day both stay).
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

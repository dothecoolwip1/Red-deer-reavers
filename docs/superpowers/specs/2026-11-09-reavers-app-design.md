# Reavers app (app.reddeerreavers.com) — design

Date: 2026-11-09. Source research: the "app.reddeerreavers.com: everything-app research" doc (2026-11-04).

## Goal

One back office for the Red Deer Reavers society: money in and out, sponsors, gear, waivers, incidents, compliance and
grants. Garrett asked to "finish the app now" and to choose sensible defaults for the open questions, so the defaults
below were chosen without a reply and are easy to change.

## Defaults chosen for the open questions

| Question | Default | Why |
| --- | --- | --- |
| Which Supabase project | The BuhurtOS home server (same as the members area and Team Admin) | One sign-in; roles come from `team_officers` and captains already there |
| Bank feed | CSV import from online banking first; Plaid/Flinks later | Works with any bank, no contract, no stored bank credentials |
| Payments | Stripe Payment Links + a webhook Edge Function that writes to the ledger; e-Transfers entered or imported from CSV | No card data touches the app |
| Accounting software | Books kept in the app, with CSV export for an accountant | Nothing to buy now |
| First sub-project | Foundation + money, then the rest in the same app as simpler record screens | Matches the recommendation on the decision card |
| Charity status | Not a registered charity: no tax receipts | The research doc's assumption |

## Architecture

- `app/`: Vite + React + TypeScript single-page app, built to `_site/app/` by the main site build and served at
  `reddeerreavers.com/app/`. A host rewrite in `vercel.json` serves it at `app.reddeerreavers.com` once that domain is
  added to the Vercel project.
- Sign-in: the BuhurtOS Supabase client (same publishable key as `assets/js/buhurtos-config.js`), Google, Discord or email.
- Data: tables prefixed `reavers_app_` in the BuhurtOS database (`app/supabase/migrations/`). Every table has RLS.
  Receipts live in a private Storage bucket `reavers-app-receipts`.
- Roles (computed in SQL, never in the browser):
  - **finance**: current president or treasurer, a team captain, or the BuhurtOS owner. Full money access.
  - **exec**: any current officer (`team_officers`, not ended), a captain, or the owner. Everything except approving money.
  - **member**: anyone on the team (`is_team_member`). Sees own waivers, reimbursements and gear loans; can sign
    waivers, file incidents and request reimbursements.
- Demo mode: with no sign-in, or before the migration is applied, the app runs on sample data in the browser so it can be
  reviewed. Demo data never reaches the database.

## Modules

1. **Dashboard**: balance, this month in and out, next deadlines, sponsor pipeline value, gear on loan, open reimbursements.
2. **Ledger**: transactions (date, description, amount in cents, category, account, receipt, notes, source), filters, totals,
   CSV export, and bank CSV import with column mapping, duplicate detection (date + amount + description) and preview.
3. **Reimbursements**: member submits with a receipt; finance approves. Amounts over $250 need two different approvers.
   Paying one writes a ledger expense.
4. **Budgets**: budget per category per year with actuals from the ledger and percentage used.
5. **Payments**: Stripe Payment Links (dues, entry fees, sponsorship, donations) listed for members; the Stripe webhook
   Edge Function records each completed checkout in the ledger, idempotent on the Stripe event id.
6. **Sponsors**: pipeline (prospect → contacted → meeting → proposal → signed → renewed / lost), tier, value, next
   follow-up, and a deliverables checklist per sponsor.
7. **Gear**: items with QR-friendly codes, condition, last inspection, check-out to a person and check-in.
8. **Waivers**: one per member per season, signed by typing the full name; guardian name for minors; exec sees who has
   not signed.
9. **Incidents**: date, person, what happened, treatment, cleared to fight.
10. **Compliance**: obligations with due dates and yearly/monthly recurrence, owner, done date; completing a recurring item
    schedules the next one.
11. **Grants**: pipeline (researching → drafting → submitted → awarded / declined → reporting) with amounts and deadlines.

## Error handling

Every database call surfaces its error in a toast; a missing table (migration not applied) switches to demo mode with a
banner saying so. Money is stored as integer cents.

## Testing

Vitest unit tests for the pure logic: CSV parsing and column guessing, duplicate detection, money formatting, budget
actuals, compliance recurrence, reimbursement approval rules, role mapping. `tsc --noEmit` and `vite build` must pass, and
the app is screenshotted in demo mode.

## Out of scope for this PR

Live bank feeds (Plaid/Flinks), accounting sync, Discord bot, AI features, tournament mode. Applying the migration and
deploying the Edge Function to production are left to Garrett (they change production).

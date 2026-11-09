# Reavers app — implementation plan

Spec: `docs/superpowers/specs/2026-11-09-reavers-app-design.md`. Executed inline (Garrett asked to finish now).

1. Pure logic first, test-first (`app/src/lib/*.ts` + `*.test.ts`): money, csv, dedupe, budgets, compliance recurrence,
   reimbursement rules, roles. Run `npm test` red, then green.
2. Migration `app/supabase/migrations/20261109000000_reavers_app.sql`: tables, role helper functions, RLS, storage bucket.
3. Data layer `app/src/data/`: one `Store` interface with a Supabase implementation and an in-browser demo implementation.
4. Shell: sign-in, role detection, navigation, demo banner, toasts.
5. Screens: dashboard, ledger + import, reimbursements, budgets, payments, sponsors, gear, waivers, incidents, compliance,
   grants. Generic record list/editor for the simple tables.
6. Stripe webhook Edge Function `app/supabase/functions/reavers-stripe-webhook/`.
7. Wire into the site build (`scripts/build-site.mjs` → `_site/app/`), `vercel.json` host rewrite, README section.
8. Verify: `npm test`, `npm run typecheck`, `npm run build` in `app/`, root `npm run build` + `npm run check`, screenshots.
9. Commit, push, open the PR.

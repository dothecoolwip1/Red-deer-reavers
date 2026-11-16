-- Reavers app: a tournament expense someone paid for themselves and won't be paid back for (Money → Tournaments).
--
--   out_of_pocket   true when a person covered the cost out of their own pocket and doesn't expect a refund. The club didn't
--                   spend the money, so it stays out of the club's costs, the cash box and the ledger, but the page shows what
--                   the edition would have netted if the club had paid.
--   covered_by      who covered it (optional).
--
-- Existing expenses are unchanged (club paid).

begin;

alter table public.reavers_app_tournament_expenses
  add column if not exists out_of_pocket boolean not null default false,
  add column if not exists covered_by text check (length(covered_by) <= 120);

commit;

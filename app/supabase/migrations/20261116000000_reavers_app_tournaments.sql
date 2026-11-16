-- Reavers app: money and stats for every tournament the Reavers host, one edition per year (Money → Tournaments).
--
--   reavers_app_tournaments             one row per edition: "Red Deer Rumble" 2026 is RUMBLE-2026. Dates, venue, the
--                                       fighter fee, and the stats (fights, rounds, spectators per day, stream, podiums).
--   reavers_app_tournament_fighters     who fought: club, divisions, fee owed, how they paid, what they paid and a status
--                                       (paid, owes, waived, not_needed).
--   reavers_app_tournament_sales        what was sold at the event: item, quantity, price, payment method and day. A line
--                                       can point at the Square item and the Square payment it came from (or the Square
--                                       transaction id from a Square CSV export), so Square sales are imported, not typed.
--   reavers_app_tournament_expenses     what the event cost: venue, gear, prizes, printing, food or other.
--   reavers_app_tournament_cash_boxes   the end-of-event cash count for each box (door, merch table…): the opening float
--                                       and the closing count by note and coin, and how much float to keep for next time.
--
-- Payment methods are cash, etransfer, debit, credit and other. Monthly dues are not tournament money and stay out.
--
-- Who can do what: a new staff page, "tournaments", on the Page access screen. Treasury edits; the executive views it by
-- default, like the other money pages; members don't see it unless an admin gives it to them. The database enforces it.
--
-- The ledger: treasury can post an edition's cash, e-transfer and other non-Square money to the ledger from the app.
-- Those lines have source 'tournament' (added here). Square card sales are already in the ledger and are never posted
-- twice. Nothing existing changes otherwise.

begin;

-- ---------------------------------------------------------------- page access learns the new page

alter table public.reavers_app_page_access drop constraint if exists reavers_app_page_access_page_check;
alter table public.reavers_app_page_access add constraint reavers_app_page_access_page_check
  check (page in ('attendance', 'ledger', 'budget', 'sales', 'dues', 'tournaments', 'sponsors', 'grants', 'gear',
    'compliance', 'site', 'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr'));

create or replace function private.reavers_app_page_level(p_page text) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when (select auth.uid()) is null then 0
    when private.reavers_app_is_finance() then 2
    when not private.reavers_app_is_member() then 0
    else coalesce(
      (select case a.access when 'edit' then 2 when 'view' then 1 else 0 end
         from public.reavers_app_page_access a where a.user_id = (select auth.uid()) and a.page = p_page),
      case when not private.reavers_app_is_exec() then 0
           when p_page in ('ledger', 'budget', 'sales', 'dues', 'tournaments') then 1
           else 2 end)
  end
$$;

create or replace function public.reavers_app_my_pages() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(p, private.reavers_app_page_level(p)), '{}'::jsonb)
  from unnest(array['attendance', 'ledger', 'budget', 'sales', 'dues', 'tournaments', 'sponsors', 'grants', 'gear',
                    'compliance', 'site', 'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr']) p
$$;
revoke all on function public.reavers_app_my_pages() from public, anon;
grant execute on function public.reavers_app_my_pages() to authenticated;

-- ---------------------------------------------------------------- the ledger takes tournament lines

alter table public.reavers_app_transactions drop constraint if exists reavers_app_transactions_source_check;
alter table public.reavers_app_transactions add constraint reavers_app_transactions_source_check
  check (source in ('manual', 'csv', 'stripe', 'square', 'reimbursement', 'tournament'));

-- ---------------------------------------------------------------- tables

create table public.reavers_app_tournaments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),        -- RUMBLE-2026
  name text not null check (length(name) between 1 and 120),                     -- Red Deer Rumble (same name each year)
  year int not null check (year between 2000 and 2100),
  starts_on date,
  ends_on date check (ends_on is null or starts_on is null or ends_on >= starts_on),
  venue text check (length(venue) <= 200),
  fighter_fee_cents bigint not null default 4000 check (fighter_fee_cents between 0 and 100000),
  notes text check (length(notes) <= 4000),
  -- Stats. fighters_count null = count the fighter list.
  fighters_count int check (fighters_count between 0 and 10000),
  divisions int check (divisions between 0 and 1000),
  fights int check (fights between 0 and 100000),
  rounds int check (rounds between 0 and 100000),
  spectators jsonb not null default '[]'::jsonb check (jsonb_typeof(spectators) = 'array'),   -- [{ "day": "Saturday", "count": 52 }]
  stream_viewers int check (stream_viewers between 0 and 10000000),
  stream_minutes int check (stream_minutes between 0 and 100000),
  clubs_attending int check (clubs_attending between 0 and 1000),
  podiums jsonb not null default '[]'::jsonb check (jsonb_typeof(podiums) = 'array'),         -- [{ "division": "...", "first": "...", "second": "...", "third": "..." }]
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, year)
);
create index reavers_app_tournaments_created_by_idx on public.reavers_app_tournaments (created_by);

create table public.reavers_app_tournament_fighters (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.reavers_app_tournaments (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  club text check (length(club) <= 120),
  divisions text check (length(divisions) <= 500),                                -- "Men's longsword, Duel"
  fee_cents bigint not null default 0 check (fee_cents between 0 and 100000),     -- what they owe (0 = didn't have to pay)
  method text check (method in ('cash', 'etransfer', 'debit', 'credit', 'other')),
  paid_cents bigint not null default 0 check (paid_cents between 0 and 100000),
  status text not null default 'owes' check (status in ('paid', 'owes', 'waived', 'not_needed')),
  square_payment_id uuid references public.reavers_app_square_payments (id) on delete set null,
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index reavers_app_tournament_fighters_tournament_idx on public.reavers_app_tournament_fighters (tournament_id);
create index reavers_app_tournament_fighters_square_idx on public.reavers_app_tournament_fighters (square_payment_id);

create table public.reavers_app_tournament_sales (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.reavers_app_tournaments (id) on delete cascade,
  item text not null check (length(item) between 1 and 200),
  quantity int not null default 1 check (quantity between 0 and 100000),
  price_cents bigint not null default 0 check (price_cents between 0 and 1000000),
  method text not null default 'cash' check (method in ('cash', 'etransfer', 'debit', 'credit', 'other')),
  sold_on date,
  square_item_id uuid references public.reavers_app_square_items (id) on delete set null,
  square_payment_id uuid references public.reavers_app_square_payments (id) on delete set null,
  square_ref text check (length(square_ref) <= 120),                              -- Square transaction id, from a Square CSV export
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index reavers_app_tournament_sales_tournament_idx on public.reavers_app_tournament_sales (tournament_id);
create index reavers_app_tournament_sales_item_idx on public.reavers_app_tournament_sales (square_item_id);
-- A Square payment line is imported once.
create unique index reavers_app_tournament_sales_square_line on public.reavers_app_tournament_sales (square_payment_id, item)
  where square_payment_id is not null;
create unique index reavers_app_tournament_sales_square_ref on public.reavers_app_tournament_sales (tournament_id, square_ref, item)
  where square_ref is not null;

create table public.reavers_app_tournament_expenses (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.reavers_app_tournaments (id) on delete cascade,
  category text not null check (category in ('venue', 'gear', 'prizes', 'printing', 'food', 'other')),
  description text check (length(description) <= 300),
  amount_cents bigint not null check (amount_cents between 0 and 10000000),
  method text not null default 'cash' check (method in ('cash', 'etransfer', 'debit', 'credit', 'other')),
  spent_on date,
  from_cash_box boolean not null default false,                                  -- paid out of the event's cash
  created_at timestamptz not null default now()
);
create index reavers_app_tournament_expenses_tournament_idx on public.reavers_app_tournament_expenses (tournament_id);

create table public.reavers_app_tournament_cash_boxes (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.reavers_app_tournaments (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),                       -- Door, Merch table
  -- Counts by denomination in cents: { "10000": 1, "2000": 5, "25": 40 } ($100, $50, $20, $10, $5, $2, $1, 25¢, 10¢, 5¢).
  opening jsonb not null default '{}'::jsonb check (jsonb_typeof(opening) = 'object'),
  closing jsonb not null default '{}'::jsonb check (jsonb_typeof(closing) = 'object'),
  counted boolean not null default false,                                         -- the closing count is done
  keep_float_cents bigint check (keep_float_cents between 0 and 1000000),         -- null = keep the same float as this time
  counted_by text check (length(counted_by) <= 120),
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (tournament_id, name)
);

-- ---------------------------------------------------------------- who can do what

alter table public.reavers_app_tournaments enable row level security;
alter table public.reavers_app_tournament_fighters enable row level security;
alter table public.reavers_app_tournament_sales enable row level security;
alter table public.reavers_app_tournament_expenses enable row level security;
alter table public.reavers_app_tournament_cash_boxes enable row level security;

create policy "tournaments page reads" on public.reavers_app_tournaments for select to authenticated
  using ((select private.reavers_app_can_view('tournaments')));
create policy "tournaments page writes" on public.reavers_app_tournaments for all to authenticated
  using ((select private.reavers_app_can_edit('tournaments'))) with check ((select private.reavers_app_can_edit('tournaments')));

create policy "tournaments page reads" on public.reavers_app_tournament_fighters for select to authenticated
  using ((select private.reavers_app_can_view('tournaments')));
create policy "tournaments page writes" on public.reavers_app_tournament_fighters for all to authenticated
  using ((select private.reavers_app_can_edit('tournaments'))) with check ((select private.reavers_app_can_edit('tournaments')));

create policy "tournaments page reads" on public.reavers_app_tournament_sales for select to authenticated
  using ((select private.reavers_app_can_view('tournaments')));
create policy "tournaments page writes" on public.reavers_app_tournament_sales for all to authenticated
  using ((select private.reavers_app_can_edit('tournaments'))) with check ((select private.reavers_app_can_edit('tournaments')));

create policy "tournaments page reads" on public.reavers_app_tournament_expenses for select to authenticated
  using ((select private.reavers_app_can_view('tournaments')));
create policy "tournaments page writes" on public.reavers_app_tournament_expenses for all to authenticated
  using ((select private.reavers_app_can_edit('tournaments'))) with check ((select private.reavers_app_can_edit('tournaments')));

create policy "tournaments page reads" on public.reavers_app_tournament_cash_boxes for select to authenticated
  using ((select private.reavers_app_can_view('tournaments')));
create policy "tournaments page writes" on public.reavers_app_tournament_cash_boxes for all to authenticated
  using ((select private.reavers_app_can_edit('tournaments'))) with check ((select private.reavers_app_can_edit('tournaments')));

grant select, insert, update, delete on public.reavers_app_tournaments, public.reavers_app_tournament_fighters,
  public.reavers_app_tournament_sales, public.reavers_app_tournament_expenses, public.reavers_app_tournament_cash_boxes
  to authenticated;

commit;

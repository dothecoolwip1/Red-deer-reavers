-- Reavers app: Square as the club's payment system.
--   * reavers_app_square_items: what the club sells or charges for (tournament registration, event visitor fee, stickers,
--     trading cards, monthly dues). Public items show on the app's open "Pay the Reavers" page, no sign-in needed.
--   * reavers_app_square_payments: every completed Square payment, online or at the table on the card reader, written only by
--     the reavers-square-webhook function (service role). Nobody writes it from the app.
--   * reavers_app_dues: who has paid monthly dues for which month: from Square automatically, or marked by treasury for cash,
--     e-Transfer or waived.
-- Square payments also land in the ledger, in a "Square" account, with Square's fee as its own line.

begin;

alter table public.reavers_app_transactions drop constraint if exists reavers_app_transactions_source_check;
alter table public.reavers_app_transactions add constraint reavers_app_transactions_source_check
  check (source in ('manual', 'csv', 'stripe', 'square', 'reimbursement'));

create table public.reavers_app_square_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 120),
  kind text not null check (kind in ('tournament', 'visitor', 'sticker', 'trading_card', 'dues', 'other')),
  description text,
  price_cents bigint not null check (price_cents > 0),
  max_quantity int not null default 1 check (max_quantity between 1 and 50),
  public boolean not null default true,                -- on the open pay page; false = signed-in members only
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.reavers_app_square_payments (
  id uuid primary key default gen_random_uuid(),
  square_payment_id text not null unique,
  square_order_id text,
  paid_at timestamptz not null,
  status text not null,
  amount_cents bigint not null,                        -- what the buyer paid, tip included
  fee_cents bigint not null default 0,                 -- Square's processing fee
  refunded_cents bigint not null default 0,
  refunds jsonb not null default '{}'::jsonb,          -- refund id -> cents, so a repeated webhook counts a refund once
  kind text not null check (kind in ('tournament', 'visitor', 'sticker', 'trading_card', 'dues', 'other', 'mixed')),
  summary text not null default '',
  items jsonb not null default '[]'::jsonb,            -- [{name, quantity, amount_cents, kind}]
  channel text not null default 'online' check (channel in ('online', 'in_person')),
  buyer_name text,
  buyer_email text,
  member_user uuid references auth.users (id) on delete set null,
  dues_month date,
  receipt_url text,
  created_at timestamptz not null default now()
);
create index reavers_app_square_payments_paid_at_idx on public.reavers_app_square_payments (paid_at desc);
create index reavers_app_square_payments_member_idx on public.reavers_app_square_payments (member_user);

create table public.reavers_app_dues (
  id uuid primary key default gen_random_uuid(),
  member_key text not null,                            -- 'membership:<BuhurtOS id>', 'user:<auth id>' or 'name:<name>'
  member_name text not null,
  member_user uuid references auth.users (id) on delete set null,
  month date not null check (extract(day from month) = 1),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  method text not null default 'square' check (method in ('square', 'cash', 'etransfer', 'waived', 'other')),
  paid_on date not null default current_date,
  square_payment_id text references public.reavers_app_square_payments (square_payment_id) on delete set null,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_key, month)
);
create index reavers_app_dues_month_idx on public.reavers_app_dues (month);
create index reavers_app_dues_member_user_idx on public.reavers_app_dues (member_user);
create index reavers_app_dues_payment_idx on public.reavers_app_dues (square_payment_id);
create index reavers_app_dues_created_by_idx on public.reavers_app_dues (created_by);

alter table public.reavers_app_square_items enable row level security;
alter table public.reavers_app_square_payments enable row level security;
alter table public.reavers_app_dues enable row level security;

-- Items: anyone (signed in or not) sees what is for sale on the open page; members also see members-only items.
create policy "anyone reads public items" on public.reavers_app_square_items for select to anon, authenticated
  using (active and public);
create policy "members read items" on public.reavers_app_square_items for select to authenticated
  using ((active and (select private.reavers_app_is_member())) or (select private.reavers_app_is_exec()));
create policy "finance writes items" on public.reavers_app_square_items for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));

-- Payments: the executive sees all of them; a member sees their own. Only the webhook (service role) writes.
create policy "exec or payer reads payments" on public.reavers_app_square_payments for select to authenticated
  using (member_user = (select auth.uid()) or (select private.reavers_app_is_exec()));

-- Dues: the executive sees all; a member sees their own; treasury marks cash, e-Transfer and waived months.
create policy "exec or member reads dues" on public.reavers_app_dues for select to authenticated
  using (member_user = (select auth.uid()) or (select private.reavers_app_is_exec()));
create policy "finance writes dues" on public.reavers_app_dues for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));

grant select on public.reavers_app_square_items to anon;
grant select, insert, update, delete on public.reavers_app_square_items, public.reavers_app_dues to authenticated;
grant select on public.reavers_app_square_payments to authenticated;

-- Treasury re-labels a payment (say a card-reader "Custom amount" that was really a visitor fee); its ledger lines follow.
create or replace function public.reavers_app_square_set_kind(p_payment uuid, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_pid text;
begin
  if not private.reavers_app_is_finance() then raise exception 'Only treasury can change a payment'; end if;
  if p_kind not in ('tournament', 'visitor', 'sticker', 'trading_card', 'dues', 'other') then raise exception 'Unknown kind %', p_kind; end if;
  update public.reavers_app_square_payments
     set kind = p_kind,
         items = (select coalesce(jsonb_agg(i || jsonb_build_object('kind', p_kind)), '[]'::jsonb) from jsonb_array_elements(items) i)
   where id = p_payment returning square_payment_id into v_pid;
  if v_pid is null then raise exception 'Payment not found'; end if;
  update public.reavers_app_transactions
     set category = case p_kind when 'tournament' then 'Event entry' when 'visitor' then 'Admissions'
                                when 'sticker' then 'Merch' when 'trading_card' then 'Merch' when 'dues' then 'Dues' else 'Other' end
   where source = 'square' and external_id like 'square-' || v_pid || '-%' and external_id not like '%-fee';
end $$;
revoke all on function public.reavers_app_square_set_kind(uuid, text) from public, anon;
grant execute on function public.reavers_app_square_set_kind(uuid, text) to authenticated;

commit;

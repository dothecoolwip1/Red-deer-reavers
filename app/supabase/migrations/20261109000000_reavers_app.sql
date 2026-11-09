-- Reavers app (app.reddeerreavers.com): back-office tables for the Red Deer Reavers, in the BuhurtOS database.
-- Apply on the BuhurtOS project (the same one the members area and Team Admin sign in to). Not yet applied to production.
--
-- Roles come from data BuhurtOS already keeps; nothing new to assign:
--   finance = BuhurtOS owner, a Reavers captain, or the current president or treasurer (team_officers, not ended)
--   exec    = finance, or any other current Reavers officer
--   member  = exec, or anyone on the Reavers team (private.is_team_member)

begin;

-- ---------------------------------------------------------------- role helpers (private: not callable over the API)

create or replace function private.reavers_app_team() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.teams where slug = 'red-deer-reavers'
$$;

create or replace function private.reavers_app_has_office(p_offices text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_officers o
    where o.team_id = private.reavers_app_team()
      and o.user_id = (select auth.uid())
      and (o.started_on is null or o.started_on <= current_date)
      and (o.ended_on is null or o.ended_on > current_date)
      and (p_offices is null or lower(o.office) = any (p_offices))
  )
$$;

create or replace function private.reavers_app_is_finance() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    private.is_owner()
    or private.is_team_captain(private.reavers_app_team())
    or private.reavers_app_has_office(array['president', 'treasurer'])
  )
$$;

create or replace function private.reavers_app_is_exec() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.reavers_app_is_finance() or private.reavers_app_has_office(null)
$$;

create or replace function private.reavers_app_is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    private.reavers_app_is_exec()
    or private.is_team_member(private.reavers_app_team(), (select auth.uid()))
  )
$$;

-- What the app shows; the policies below are what actually decide.
create or replace function public.reavers_app_my_role() returns text
language sql stable security definer set search_path = '' as $$
  select case
    when private.reavers_app_is_finance() then 'finance'
    when private.reavers_app_is_exec() then 'exec'
    when private.reavers_app_is_member() then 'member'
    else 'none' end
$$;
revoke all on function public.reavers_app_my_role() from public, anon;
grant execute on function public.reavers_app_my_role() to authenticated;

-- ---------------------------------------------------------------- money

create table public.reavers_app_transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null default '',
  amount_cents bigint not null,                       -- money in is positive, money out negative
  category text,
  account text not null default 'Chequing',
  notes text,
  receipt_path text,                                  -- object in the reavers-app-receipts bucket
  source text not null default 'manual' check (source in ('manual', 'csv', 'stripe', 'reimbursement')),
  external_id text unique,                            -- Stripe event id, so a retried webhook is recorded once
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_transactions_date_idx on public.reavers_app_transactions (date desc);
create index reavers_app_transactions_category_idx on public.reavers_app_transactions (category);
create index reavers_app_transactions_created_by_idx on public.reavers_app_transactions (created_by);

create table public.reavers_app_budgets (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  category text not null,
  kind text not null default 'expense' check (kind in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents >= 0),
  unique (year, category)
);

create table public.reavers_app_payment_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null check (url ~ '^https://'),
  amount_cents bigint,
  kind text not null default 'other' check (kind in ('dues', 'entry', 'sponsorship', 'donation', 'merch', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reavers_app_reimbursements (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  submitter_name text not null default '',
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  category text,
  spent_on date not null default current_date,
  receipt_path text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'paid', 'rejected')),
  decision_note text,
  paid_transaction_id uuid references public.reavers_app_transactions (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_reimbursements_submitted_by_idx on public.reavers_app_reimbursements (submitted_by);
create index reavers_app_reimbursements_paid_tx_idx on public.reavers_app_reimbursements (paid_transaction_id);

create table public.reavers_app_reimbursement_approvals (
  reimbursement_id uuid not null references public.reavers_app_reimbursements (id) on delete cascade,
  approver uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reimbursement_id, approver)
);
create index reavers_app_reimbursement_approvals_approver_idx on public.reavers_app_reimbursement_approvals (approver);

-- Approve a claim. Over $250 needs two different approvers; nobody approves their own claim.
create or replace function public.reavers_app_approve_reimbursement(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  claim public.reavers_app_reimbursements;
  approvers int;
begin
  if not private.reavers_app_is_finance() then raise exception 'Only the treasurer, president or a captain can approve'; end if;
  select * into claim from public.reavers_app_reimbursements where id = p_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if claim.status <> 'submitted' then raise exception 'This claim is already %', claim.status; end if;
  if claim.submitted_by = (select auth.uid()) then raise exception 'You cannot approve your own claim'; end if;
  insert into public.reavers_app_reimbursement_approvals (reimbursement_id, approver)
    values (p_id, (select auth.uid())) on conflict do nothing;
  select count(*) into approvers from public.reavers_app_reimbursement_approvals where reimbursement_id = p_id;
  if approvers >= (case when claim.amount_cents > 25000 then 2 else 1 end) then
    update public.reavers_app_reimbursements set status = 'approved' where id = p_id;
    return 'approved';
  end if;
  return 'submitted';
end $$;

-- Mark an approved claim paid and record the expense in the ledger.
create or replace function public.reavers_app_pay_reimbursement(p_id uuid, p_paid_on date default current_date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  claim public.reavers_app_reimbursements;
  tx uuid;
begin
  if not private.reavers_app_is_finance() then raise exception 'Only the treasurer, president or a captain can pay claims'; end if;
  select * into claim from public.reavers_app_reimbursements where id = p_id for update;
  if not found or claim.status <> 'approved' then raise exception 'Only approved claims can be paid'; end if;
  insert into public.reavers_app_transactions (date, description, amount_cents, category, receipt_path, source)
    values (p_paid_on, 'Reimbursement: ' || claim.submitter_name || ' - ' || claim.description, -claim.amount_cents,
            claim.category, claim.receipt_path, 'reimbursement')
    returning id into tx;
  update public.reavers_app_reimbursements set status = 'paid', paid_transaction_id = tx where id = p_id;
  return tx;
end $$;

create or replace function public.reavers_app_reject_reimbursement(p_id uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.reavers_app_is_finance() then raise exception 'Only the treasurer, president or a captain can reject claims'; end if;
  update public.reavers_app_reimbursements set status = 'rejected', decision_note = p_note
    where id = p_id and status in ('submitted', 'approved');
end $$;

revoke all on function public.reavers_app_approve_reimbursement(uuid) from public, anon;
revoke all on function public.reavers_app_pay_reimbursement(uuid, date) from public, anon;
revoke all on function public.reavers_app_reject_reimbursement(uuid, text) from public, anon;
grant execute on function public.reavers_app_approve_reimbursement(uuid) to authenticated;
grant execute on function public.reavers_app_pay_reimbursement(uuid, date) to authenticated;
grant execute on function public.reavers_app_reject_reimbursement(uuid, text) to authenticated;

-- ---------------------------------------------------------------- sponsors, grants, compliance

create table public.reavers_app_sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  stage text not null default 'prospect'
    check (stage in ('prospect', 'contacted', 'meeting', 'proposal', 'signed', 'renewed', 'lost')),
  tier text,
  value_cents bigint,
  in_kind boolean not null default false,
  next_follow_up date,
  renews_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.reavers_app_sponsor_deliverables (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.reavers_app_sponsors (id) on delete cascade,
  title text not null,
  due date,
  done_on date
);
create index reavers_app_sponsor_deliverables_sponsor_idx on public.reavers_app_sponsor_deliverables (sponsor_id);

create table public.reavers_app_grants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  funder text,
  stage text not null default 'researching'
    check (stage in ('researching', 'drafting', 'submitted', 'awarded', 'declined', 'reporting', 'closed')),
  amount_cents bigint,
  deadline date,
  report_due date,
  link text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.reavers_app_compliance (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authority text,
  due date not null,
  recurrence text not null default 'yearly' check (recurrence in ('once', 'monthly', 'quarterly', 'yearly')),
  owner text,
  done_on date,
  link text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- safety and gear

create table public.reavers_app_gear (
  id uuid primary key default gen_random_uuid(),
  code text unique,                                   -- printed on the QR tag
  name text not null,
  kind text,
  condition text not null default 'good' check (condition in ('new', 'good', 'worn', 'repair', 'retired')),
  last_inspected date,
  holder_name text,
  holder_user uuid references auth.users (id) on delete set null,
  checked_out_on date,
  notes text,
  created_at timestamptz not null default now()
);
create index reavers_app_gear_holder_idx on public.reavers_app_gear (holder_user);

create table public.reavers_app_gear_log (
  id uuid primary key default gen_random_uuid(),
  gear_id uuid not null references public.reavers_app_gear (id) on delete cascade,
  action text not null check (action in ('out', 'in', 'inspected', 'note')),
  person text,
  note text,
  at timestamptz not null default now(),
  by_user uuid default auth.uid() references auth.users (id) on delete set null
);
create index reavers_app_gear_log_gear_idx on public.reavers_app_gear_log (gear_id);
create index reavers_app_gear_log_by_idx on public.reavers_app_gear_log (by_user);

create table public.reavers_app_waivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  season int not null,
  full_name text not null,
  signed_name text not null,
  is_minor boolean not null default false,
  guardian_name text,
  emergency_contact text,
  emergency_phone text,
  medical_notes text,                                 -- seen only by the signer and the executive
  signed_at timestamptz not null default now(),
  unique (user_id, season),
  check (lower(trim(signed_name)) = lower(trim(full_name)) or is_minor),
  check (not is_minor or coalesce(trim(guardian_name), '') <> '')
);

create table public.reavers_app_incidents (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  person text not null,
  description text not null,
  treatment text,
  cleared_to_fight boolean not null default false,
  reported_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_incidents_reported_by_idx on public.reavers_app_incidents (reported_by);

-- ---------------------------------------------------------------- row-level security

alter table public.reavers_app_transactions enable row level security;
alter table public.reavers_app_budgets enable row level security;
alter table public.reavers_app_payment_links enable row level security;
alter table public.reavers_app_reimbursements enable row level security;
alter table public.reavers_app_reimbursement_approvals enable row level security;
alter table public.reavers_app_sponsors enable row level security;
alter table public.reavers_app_sponsor_deliverables enable row level security;
alter table public.reavers_app_grants enable row level security;
alter table public.reavers_app_compliance enable row level security;
alter table public.reavers_app_gear enable row level security;
alter table public.reavers_app_gear_log enable row level security;
alter table public.reavers_app_waivers enable row level security;
alter table public.reavers_app_incidents enable row level security;

-- Money: the executive reads, finance writes.
create policy "exec reads ledger" on public.reavers_app_transactions for select to authenticated using ((select private.reavers_app_is_exec()));
create policy "finance writes ledger" on public.reavers_app_transactions for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));
create policy "exec reads budgets" on public.reavers_app_budgets for select to authenticated using ((select private.reavers_app_is_exec()));
create policy "finance writes budgets" on public.reavers_app_budgets for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));
create policy "members read active pay links" on public.reavers_app_payment_links for select to authenticated
  using ((active and (select private.reavers_app_is_member())) or (select private.reavers_app_is_exec()));
create policy "finance writes pay links" on public.reavers_app_payment_links for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));

-- Reimbursements: members file and see their own; the executive sees all; decisions only through the functions above.
create policy "read own or exec" on public.reavers_app_reimbursements for select to authenticated
  using (submitted_by = (select auth.uid()) or (select private.reavers_app_is_exec()));
create policy "members file own claims" on public.reavers_app_reimbursements for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'submitted' and paid_transaction_id is null
              and (select private.reavers_app_is_member()));
create policy "withdraw own open claim" on public.reavers_app_reimbursements for delete to authenticated
  using (submitted_by = (select auth.uid()) and status = 'submitted');
create policy "exec reads approvals" on public.reavers_app_reimbursement_approvals for select to authenticated
  using ((select private.reavers_app_is_exec()) or approver = (select auth.uid()));

-- Executive records.
create policy "exec sponsors" on public.reavers_app_sponsors for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec deliverables" on public.reavers_app_sponsor_deliverables for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec grants" on public.reavers_app_grants for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec compliance" on public.reavers_app_compliance for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));

-- Gear: the executive runs the armory; members see what they have on loan.
create policy "exec gear" on public.reavers_app_gear for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "members see own loans" on public.reavers_app_gear for select to authenticated
  using (holder_user = (select auth.uid()));
create policy "exec gear log" on public.reavers_app_gear_log for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));

-- Waivers: a member signs and reads their own; the executive reads all and can remove one (to have it re-signed).
create policy "sign own waiver" on public.reavers_app_waivers for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.reavers_app_is_member()));
create policy "read own or exec waivers" on public.reavers_app_waivers for select to authenticated
  using (user_id = (select auth.uid()) or (select private.reavers_app_is_exec()));
create policy "exec removes waivers" on public.reavers_app_waivers for delete to authenticated
  using ((select private.reavers_app_is_exec()));

-- Incidents: any member can report; the reporter and the executive read; the executive updates.
create policy "members report incidents" on public.reavers_app_incidents for insert to authenticated
  with check (reported_by = (select auth.uid()) and (select private.reavers_app_is_member()));
create policy "read own or exec incidents" on public.reavers_app_incidents for select to authenticated
  using (reported_by = (select auth.uid()) or (select private.reavers_app_is_exec()));
create policy "exec updates incidents" on public.reavers_app_incidents for update to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec deletes incidents" on public.reavers_app_incidents for delete to authenticated
  using ((select private.reavers_app_is_exec()));

-- ---------------------------------------------------------------- receipts bucket (private)
-- Files go under <user id>/...; the uploader and the executive can read them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reavers-app-receipts', 'reavers-app-receipts', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

create policy "reavers receipts upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'reavers-app-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text
              and (select private.reavers_app_is_member()));
create policy "reavers receipts read own or exec" on storage.objects for select to authenticated
  using (bucket_id = 'reavers-app-receipts'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.reavers_app_is_exec())));

-- ---------------------------------------------------------------- starter compliance calendar (edit dates in the app)

insert into public.reavers_app_compliance (title, authority, due, recurrence, owner, notes) values
  ('Society annual return and financial statement', 'Alberta Corporate Registry', make_date(extract(year from current_date)::int, 12, 31), 'yearly', 'Secretary', 'File after the AGM. Set the real date from the society''s anniversary month.'),
  ('Annual general meeting', 'Members (bylaws)', make_date(extract(year from current_date)::int, 12, 31), 'yearly', 'President', 'Run through the members area.'),
  ('Liability insurance renewal', 'Insurer', make_date(extract(year from current_date)::int, 12, 31), 'yearly', 'Treasurer', 'Send the member list and the incident log.'),
  ('Non-profit information return (T1044), if required', 'CRA', make_date(extract(year from current_date)::int + 1, 6, 30), 'yearly', 'Treasurer', 'Needed when income or assets pass CRA''s thresholds. Due six months after year end.');

commit;

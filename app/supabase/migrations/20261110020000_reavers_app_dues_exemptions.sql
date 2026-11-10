-- Reavers app: members who are exempt from paying monthly dues (a coach, a volunteer, hardship), for a stretch of months
-- or open-ended. Exempt months show as "Exempt" on the Dues page instead of unpaid. The executive reads; treasury writes.

begin;

create table public.reavers_app_dues_exemptions (
  id uuid primary key default gen_random_uuid(),
  member_key text not null,                            -- same key as reavers_app_dues.member_key
  member_name text not null,
  reason text,
  starts_month date not null default date_trunc('month', current_date)::date check (extract(day from starts_month) = 1),
  ends_month date check (ends_month is null or (extract(day from ends_month) = 1 and ends_month >= starts_month)),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_dues_exemptions_member_idx on public.reavers_app_dues_exemptions (member_key);
create index reavers_app_dues_exemptions_created_by_idx on public.reavers_app_dues_exemptions (created_by);

alter table public.reavers_app_dues_exemptions enable row level security;
create policy "exec reads exemptions" on public.reavers_app_dues_exemptions for select to authenticated
  using ((select private.reavers_app_is_exec()));
create policy "finance writes exemptions" on public.reavers_app_dues_exemptions for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));
grant select, insert, update, delete on public.reavers_app_dues_exemptions to authenticated;

commit;

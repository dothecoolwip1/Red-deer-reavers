-- Reavers app: admins choose who can see and use each staff page of the app.
--
-- Until now each page followed the BuhurtOS role alone (treasury, executive, member). This adds per-person overrides:
--
--   reavers_app_page_access   one row per person and page: 'none' (hidden), 'view' (read only) or 'edit' (full use).
--                             No row means the page follows the person's role, exactly as before.
--
-- Admins are treasury (the BuhurtOS owner, a Reavers captain, the current president or treasurer). They manage the
-- overrides on the app's Page access screen and always keep every page, so nobody can lock the club out of its own app.
--
-- The database enforces it: the policies on each page's tables now ask private.reavers_app_page_level(<page>) instead of
-- the plain role check, so a hidden page's records can't be read over the API either, and someone given a page can really
-- use it. Pages everyone has (Home, Reimbursements, Pay the club, Waiver, Incidents) are not affected.
--
-- Pages: attendance, ledger, budget, sales, dues, sponsors, grants, gear, compliance, site (site editor), and the website
-- pages calendar, team, practices, inquiries, site-settings, qr. The website pages other than the site editor save through
-- BuhurtOS (public.reavers_site), which still asks for a Reavers captain; here they can only be hidden.
--
-- Default for an executive with no override: view the money pages (ledger, budget, sales, dues), use everything else.
-- Default for a member: none of these pages.

begin;

create table public.reavers_app_page_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  page text not null check (page in ('attendance', 'ledger', 'budget', 'sales', 'dues', 'sponsors', 'grants', 'gear',
    'compliance', 'site', 'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr')),
  access text not null check (access in ('none', 'view', 'edit')),
  set_by uuid default auth.uid() references auth.users (id) on delete set null,
  set_at timestamptz not null default now(),
  primary key (user_id, page)
);
create index reavers_app_page_access_set_by_idx on public.reavers_app_page_access (set_by);

-- 0 = no access, 1 = view, 2 = use (edit), for the person signed in.
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
           when p_page in ('ledger', 'budget', 'sales', 'dues') then 1
           else 2 end)
  end
$$;

create or replace function private.reavers_app_can_view(p_page text) returns boolean
language sql stable security definer set search_path = '' as $$ select private.reavers_app_page_level(p_page) >= 1 $$;
create or replace function private.reavers_app_can_edit(p_page text) returns boolean
language sql stable security definer set search_path = '' as $$ select private.reavers_app_page_level(p_page) >= 2 $$;

grant execute on function private.reavers_app_page_level(text), private.reavers_app_can_view(text),
  private.reavers_app_can_edit(text) to authenticated;

-- What the app shows in its menu: { "ledger": 1, "sponsors": 2, ... } for the person signed in.
create or replace function public.reavers_app_my_pages() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(p, private.reavers_app_page_level(p)), '{}'::jsonb)
  from unnest(array['attendance', 'ledger', 'budget', 'sales', 'dues', 'sponsors', 'grants', 'gear', 'compliance', 'site',
                    'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr']) p
$$;
revoke all on function public.reavers_app_my_pages() from public, anon;
grant execute on function public.reavers_app_my_pages() to authenticated;

-- Who an admin can give pages to: everyone on the Reavers team with a BuhurtOS account (team roles, fighter profiles,
-- memberships and officers), with a display name and their role. Admins only.
create or replace function public.reavers_app_access_people()
returns table (user_id uuid, name text, role text)
language plpgsql stable security definer set search_path = '' as $$
declare
  t uuid := private.reavers_app_team();
begin
  if not private.reavers_app_is_finance() then raise exception 'Only treasury can manage page access'; end if;
  return query
  with ids as (
    select r.user_id from public.team_roles r where r.team_id = t
    union select fa.user_id from public.fighter_accounts fa
      join public.team_memberships m on m.fighter_id = fa.fighter_id and m.team_id = t and (m.to_date is null or m.to_date >= current_date)
    union select fa.user_id from public.fighter_accounts fa join public.fighters f on f.id = fa.fighter_id where f.team_id = t
    union select o.user_id from public.team_officers o where o.team_id = t
      and (o.started_on is null or o.started_on <= current_date) and (o.ended_on is null or o.ended_on > current_date)
  )
  select ids.user_id,
    coalesce(
      nullif(trim((select p.display_name from public.profiles p where p.id = ids.user_id)), ''),
      (select f.display_name from public.fighter_accounts fa join public.fighters f on f.id = fa.fighter_id
         where fa.user_id = ids.user_id order by (f.team_id = t) desc nulls last limit 1),
      'Member ' || left(ids.user_id::text, 8)) as name,
    case
      when exists (select 1 from public.team_roles r where r.team_id = t and r.user_id = ids.user_id and r.role = 'captain')
        or exists (select 1 from public.team_officers o where o.team_id = t and o.user_id = ids.user_id
                     and lower(o.office) in ('president', 'treasurer')
                     and (o.started_on is null or o.started_on <= current_date) and (o.ended_on is null or o.ended_on > current_date))
        then 'finance'
      when exists (select 1 from public.team_officers o where o.team_id = t and o.user_id = ids.user_id
                     and (o.started_on is null or o.started_on <= current_date) and (o.ended_on is null or o.ended_on > current_date))
        then 'exec'
      else 'member' end as role
  from ids
  where ids.user_id is not null
  order by 2;
end $$;
revoke all on function public.reavers_app_access_people() from public, anon;
grant execute on function public.reavers_app_access_people() to authenticated;

alter table public.reavers_app_page_access enable row level security;
create policy "read own page access or admin" on public.reavers_app_page_access for select to authenticated
  using (user_id = (select auth.uid()) or (select private.reavers_app_is_finance()));
create policy "admin sets page access" on public.reavers_app_page_access for all to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));
grant select, insert, update, delete on public.reavers_app_page_access to authenticated;

-- ---------------------------------------------------------------- the pages' tables follow page access

-- Ledger
drop policy "exec reads ledger" on public.reavers_app_transactions;
drop policy "finance writes ledger" on public.reavers_app_transactions;
create policy "ledger page reads" on public.reavers_app_transactions for select to authenticated
  using ((select private.reavers_app_can_view('ledger')));
create policy "ledger page writes" on public.reavers_app_transactions for all to authenticated
  using ((select private.reavers_app_can_edit('ledger'))) with check ((select private.reavers_app_can_edit('ledger')));

-- Budget
drop policy "exec reads budgets" on public.reavers_app_budgets;
drop policy "finance writes budgets" on public.reavers_app_budgets;
create policy "budget page reads" on public.reavers_app_budgets for select to authenticated
  using ((select private.reavers_app_can_view('budget')));
create policy "budget page writes" on public.reavers_app_budgets for all to authenticated
  using ((select private.reavers_app_can_edit('budget'))) with check ((select private.reavers_app_can_edit('budget')));

-- Square sales (the Dues page reads payments too, to file card-reader dues)
drop policy "exec or payer reads payments" on public.reavers_app_square_payments;
create policy "payer or sales or dues page reads payments" on public.reavers_app_square_payments for select to authenticated
  using (member_user = (select auth.uid()) or (select private.reavers_app_can_view('sales')) or (select private.reavers_app_can_view('dues')));

create or replace function public.reavers_app_square_set_kind(p_payment uuid, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_pid text;
begin
  if not private.reavers_app_can_edit('sales') then raise exception 'You can''t change payments; ask treasury for edit access to Square sales'; end if;
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

-- Dues and exemptions
drop policy "exec or member reads dues" on public.reavers_app_dues;
drop policy "finance writes dues" on public.reavers_app_dues;
create policy "member or dues page reads dues" on public.reavers_app_dues for select to authenticated
  using (member_user = (select auth.uid()) or (select private.reavers_app_can_view('dues')));
create policy "dues page writes dues" on public.reavers_app_dues for all to authenticated
  using ((select private.reavers_app_can_edit('dues'))) with check ((select private.reavers_app_can_edit('dues')));
drop policy "exec reads exemptions" on public.reavers_app_dues_exemptions;
drop policy "finance writes exemptions" on public.reavers_app_dues_exemptions;
create policy "dues page reads exemptions" on public.reavers_app_dues_exemptions for select to authenticated
  using ((select private.reavers_app_can_view('dues')));
create policy "dues page writes exemptions" on public.reavers_app_dues_exemptions for all to authenticated
  using ((select private.reavers_app_can_edit('dues'))) with check ((select private.reavers_app_can_edit('dues')));

-- Sponsors
drop policy "exec sponsors" on public.reavers_app_sponsors;
drop policy "exec deliverables" on public.reavers_app_sponsor_deliverables;
create policy "sponsors page reads" on public.reavers_app_sponsors for select to authenticated
  using ((select private.reavers_app_can_view('sponsors')));
create policy "sponsors page writes" on public.reavers_app_sponsors for all to authenticated
  using ((select private.reavers_app_can_edit('sponsors'))) with check ((select private.reavers_app_can_edit('sponsors')));
create policy "sponsors page reads deliverables" on public.reavers_app_sponsor_deliverables for select to authenticated
  using ((select private.reavers_app_can_view('sponsors')));
create policy "sponsors page writes deliverables" on public.reavers_app_sponsor_deliverables for all to authenticated
  using ((select private.reavers_app_can_edit('sponsors'))) with check ((select private.reavers_app_can_edit('sponsors')));

-- Grants
drop policy "exec grants" on public.reavers_app_grants;
create policy "grants page reads" on public.reavers_app_grants for select to authenticated
  using ((select private.reavers_app_can_view('grants')));
create policy "grants page writes" on public.reavers_app_grants for all to authenticated
  using ((select private.reavers_app_can_edit('grants'))) with check ((select private.reavers_app_can_edit('grants')));

-- Deadlines
drop policy "exec compliance" on public.reavers_app_compliance;
create policy "deadlines page reads" on public.reavers_app_compliance for select to authenticated
  using ((select private.reavers_app_can_view('compliance')));
create policy "deadlines page writes" on public.reavers_app_compliance for all to authenticated
  using ((select private.reavers_app_can_edit('compliance'))) with check ((select private.reavers_app_can_edit('compliance')));

-- Armory (members still see what they have on loan through "members see own loans")
drop policy "exec gear" on public.reavers_app_gear;
drop policy "exec gear log" on public.reavers_app_gear_log;
create policy "armory page reads" on public.reavers_app_gear for select to authenticated
  using ((select private.reavers_app_can_view('gear')));
create policy "armory page writes" on public.reavers_app_gear for all to authenticated
  using ((select private.reavers_app_can_edit('gear'))) with check ((select private.reavers_app_can_edit('gear')));
create policy "armory page reads log" on public.reavers_app_gear_log for select to authenticated
  using ((select private.reavers_app_can_view('gear')));
create policy "armory page writes log" on public.reavers_app_gear_log for all to authenticated
  using ((select private.reavers_app_can_edit('gear'))) with check ((select private.reavers_app_can_edit('gear')));

-- Site editor
drop policy "exec edits site content" on public.reavers_app_site_content;
drop policy "exec updates site content" on public.reavers_app_site_content;
drop policy "exec removes site content" on public.reavers_app_site_content;
drop policy "exec reads site history" on public.reavers_app_site_content_history;
drop policy "reavers site media exec upload" on storage.objects;
create policy "site editor page adds" on public.reavers_app_site_content for insert to authenticated
  with check ((select private.reavers_app_can_edit('site')));
create policy "site editor page updates" on public.reavers_app_site_content for update to authenticated
  using ((select private.reavers_app_can_edit('site'))) with check ((select private.reavers_app_can_edit('site')));
create policy "site editor page removes" on public.reavers_app_site_content for delete to authenticated
  using ((select private.reavers_app_can_edit('site')));
create policy "site editor page reads history" on public.reavers_app_site_content_history for select to authenticated
  using ((select private.reavers_app_can_view('site')));
create policy "reavers site media editor upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'reavers-site-media' and (select private.reavers_app_can_edit('site')));

-- Attendance
drop policy "exec manages people" on public.reavers_app_people;
drop policy "exec manages gatherings" on public.reavers_app_gatherings;
drop policy "exec takes attendance" on public.reavers_app_attendance;
create policy "attendance page reads people" on public.reavers_app_people for select to authenticated
  using ((select private.reavers_app_can_view('attendance')));
create policy "attendance page writes people" on public.reavers_app_people for all to authenticated
  using ((select private.reavers_app_can_edit('attendance'))) with check ((select private.reavers_app_can_edit('attendance')));
create policy "attendance page reads gatherings" on public.reavers_app_gatherings for select to authenticated
  using ((select private.reavers_app_can_view('attendance')));
create policy "attendance page writes gatherings" on public.reavers_app_gatherings for all to authenticated
  using ((select private.reavers_app_can_edit('attendance'))) with check ((select private.reavers_app_can_edit('attendance')));
create policy "attendance page reads attendance" on public.reavers_app_attendance for select to authenticated
  using ((select private.reavers_app_can_view('attendance')));
create policy "attendance page takes attendance" on public.reavers_app_attendance for all to authenticated
  using ((select private.reavers_app_can_edit('attendance'))) with check ((select private.reavers_app_can_edit('attendance')));

create or replace function public.reavers_app_start_removal(p_person uuid, p_days int, p_note text default null)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_can_edit('attendance') then raise exception 'Only someone who can use the Attendance page can start a removal timer'; end if;
  if p_days is null or p_days < 7 or p_days > 90 then raise exception 'Give them between 7 and 90 days'; end if;
  update public.reavers_app_people set
      status = 'removal', removal_started_at = now(), removal_started_by = (select auth.uid()),
      removal_deadline = current_date + p_days, removal_note = nullif(trim(p_note), ''), removal_alerted_at = null,
      reply_text = null, reply_at = null, dm_sent_at = null, dm_error = null
    where id = p_person and status in ('active', 'away')
    returning * into row;
  if not found then raise exception 'This person already has a timer running or has been removed'; end if;
  return row;
end $$;

create or replace function public.reavers_app_stop_removal(p_person uuid, p_note text default null)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_can_edit('attendance') then raise exception 'Only someone who can use the Attendance page can stop a removal timer'; end if;
  update public.reavers_app_people set
      status = 'active', removal_started_at = null, removal_started_by = null, removal_deadline = null, removal_alerted_at = null,
      removal_note = null, removed_on = null,
      notes = case when nullif(trim(p_note), '') is null then notes
                   else concat_ws(E'\n', notes, to_char(current_date, 'YYYY-MM-DD') || ' kept on: ' || trim(p_note)) end
    where id = p_person and status in ('removal', 'removed')
    returning * into row;
  if not found then raise exception 'There is no removal timer to stop'; end if;
  return row;
end $$;

create or replace function public.reavers_app_mark_removed(p_person uuid)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_can_edit('attendance') then raise exception 'Only someone who can use the Attendance page can remove someone'; end if;
  select * into row from public.reavers_app_people where id = p_person for update;
  if not found then raise exception 'Person not found'; end if;
  if row.status <> 'removal' then raise exception 'Start the removal timer first'; end if;
  if row.removal_deadline > current_date then
    raise exception 'The timer runs until %; stop it or wait', to_char(row.removal_deadline, 'FMMonth FMDD');
  end if;
  update public.reavers_app_people set status = 'removed', removed_on = current_date where id = p_person returning * into row;
  return row;
end $$;

create or replace function public.reavers_app_set_away(p_person uuid, p_away boolean)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_can_edit('attendance') then raise exception 'Only someone who can use the Attendance page can change this'; end if;
  update public.reavers_app_people set status = case when p_away then 'away' else 'active' end
    where id = p_person and status in ('active', 'away') returning * into row;
  if not found then raise exception 'Stop the removal timer first'; end if;
  return row;
end $$;

commit;

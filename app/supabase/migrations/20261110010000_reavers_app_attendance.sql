-- Reavers app: member attendance and the 3-month no-show policy.
--
--   reavers_app_people       everyone the club keeps track of, linked (when known) to their BuhurtOS account, fighter or
--                            club membership, with when they started and the last time anyone heard from them
--   reavers_app_gatherings   each practice, tournament, event or fundraiser
--   reavers_app_attendance   who was at which gathering
--   reavers_app_people_stats how often each person shows up, their last practice and the last time they were seen
--
-- No-show: an active person whose last attendance (or their start date, if they have never been marked present) is more than
-- 3 months ago. The app lists them and the Discord bot (supabase/functions/reavers-attendance-bot) posts them to the
-- leadership channel once per absence.
--
-- Removal timer: a captain or executive starts it with reavers_app_start_removal, which sets a deadline; the bot messages
-- the member on Discord and asks why. Stopping it or marking someone removed goes through the functions below, so the
-- timer can't be skipped by editing the row. Nobody is kicked from BuhurtOS or Discord automatically.
--
-- Only the executive (every current officer, a captain or the BuhurtOS owner) can read or change any of this.

begin;

create table public.reavers_app_people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (trim(name) <> ''),
  user_id uuid references auth.users (id) on delete set null,   -- their BuhurtOS account, when known
  fighter_id uuid,                                              -- BuhurtOS fighter profile
  membership_id uuid,                                           -- BuhurtOS club membership
  discord_id text check (discord_id is null or discord_id ~ '^[0-9]{15,22}$'),  -- only needed when the account isn't linked to Discord
  discord_name text,
  started_on date,
  last_contact_on date,
  last_contact_note text,
  notes text,
  status text not null default 'active' check (status in ('active', 'away', 'removal', 'removed')),
  -- the removal timer (set only through the functions below)
  removal_started_at timestamptz,
  removal_started_by uuid references auth.users (id) on delete set null,
  removal_deadline date,
  removal_note text,
  removal_alerted_at timestamptz,          -- the bot told leadership the timer ran out
  removed_on date,
  -- the member's answer on Discord
  dm_sent_at timestamptz,
  dm_error text,
  reply_text text,
  reply_at timestamptz,
  no_show_alerted_for date,                -- the absence (last seen date) leadership was already told about
  created_at timestamptz not null default now(),
  check (status <> 'removal' or (removal_deadline is not null and removal_started_at is not null))
);
create index reavers_app_people_user_idx on public.reavers_app_people (user_id);
create unique index reavers_app_people_fighter_idx on public.reavers_app_people (fighter_id) where fighter_id is not null;
create unique index reavers_app_people_membership_idx on public.reavers_app_people (membership_id) where membership_id is not null;
create index reavers_app_people_started_by_idx on public.reavers_app_people (removal_started_by);

create table public.reavers_app_gatherings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('practice', 'tournament', 'event', 'fundraiser')),
  title text not null default '',
  date date not null default current_date,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_gatherings_date_idx on public.reavers_app_gatherings (date desc);
create index reavers_app_gatherings_created_by_idx on public.reavers_app_gatherings (created_by);

create table public.reavers_app_attendance (
  gathering_id uuid not null references public.reavers_app_gatherings (id) on delete cascade,
  person_id uuid not null references public.reavers_app_people (id) on delete cascade,
  marked_by uuid default auth.uid() references auth.users (id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (gathering_id, person_id)
);
create index reavers_app_attendance_person_idx on public.reavers_app_attendance (person_id);
create index reavers_app_attendance_marked_by_idx on public.reavers_app_attendance (marked_by);

-- How often each person shows up. security_invoker, so the policies on the tables underneath still decide who sees it.
create view public.reavers_app_people_stats with (security_invoker = true) as
  select p.id as person_id,
    count(g.id) as total,
    count(g.id) filter (where g.kind = 'practice') as practices,
    count(g.id) filter (where g.kind = 'tournament') as tournaments,
    count(g.id) filter (where g.kind = 'event') as events,
    count(g.id) filter (where g.kind = 'fundraiser') as fundraisers,
    count(g.id) filter (where g.date > (current_date - interval '3 months')) as recent,
    min(g.date) as first_seen,
    max(g.date) as last_seen,
    max(g.date) filter (where g.kind = 'practice') as last_practice
  from public.reavers_app_people p
  left join public.reavers_app_attendance a on a.person_id = p.id
  left join public.reavers_app_gatherings g on g.id = a.gathering_id and g.date <= current_date
  group by p.id;

alter table public.reavers_app_people enable row level security;
alter table public.reavers_app_gatherings enable row level security;
alter table public.reavers_app_attendance enable row level security;

create policy "exec manages people" on public.reavers_app_people for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec manages gatherings" on public.reavers_app_gatherings for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec takes attendance" on public.reavers_app_attendance for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));

-- The executive edits the plain details; status, the timer and the Discord fields change only through the functions.
grant select, delete on public.reavers_app_people to authenticated;
grant insert (name, user_id, fighter_id, membership_id, discord_id, discord_name, started_on, last_contact_on, last_contact_note, notes)
  on public.reavers_app_people to authenticated;
grant update (name, user_id, fighter_id, membership_id, discord_id, discord_name, started_on, last_contact_on, last_contact_note, notes)
  on public.reavers_app_people to authenticated;
grant select, insert, update, delete on public.reavers_app_gatherings, public.reavers_app_attendance to authenticated;
grant select on public.reavers_app_people_stats to authenticated;

-- ---------------------------------------------------------------- the removal timer

create or replace function public.reavers_app_start_removal(p_person uuid, p_days int, p_note text default null)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_is_exec() then raise exception 'Only a captain or the executive can start a removal timer'; end if;
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
  if not private.reavers_app_is_exec() then raise exception 'Only a captain or the executive can stop a removal timer'; end if;
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
  if not private.reavers_app_is_exec() then raise exception 'Only a captain or the executive can remove someone'; end if;
  select * into row from public.reavers_app_people where id = p_person for update;
  if not found then raise exception 'Person not found'; end if;
  if row.status <> 'removal' then raise exception 'Start the removal timer first'; end if;
  if row.removal_deadline > current_date then
    raise exception 'The timer runs until %; stop it or wait', to_char(row.removal_deadline, 'FMMonth FMDD');
  end if;
  update public.reavers_app_people set status = 'removed', removed_on = current_date where id = p_person returning * into row;
  return row;
end $$;

-- Away (injury, work, travel): no-show alerts pause until they're set back to active.
create or replace function public.reavers_app_set_away(p_person uuid, p_away boolean)
returns public.reavers_app_people
language plpgsql security definer set search_path = '' as $$
declare
  row public.reavers_app_people;
begin
  if not private.reavers_app_is_exec() then raise exception 'Only a captain or the executive can change this'; end if;
  update public.reavers_app_people set status = case when p_away then 'away' else 'active' end
    where id = p_person and status in ('active', 'away') returning * into row;
  if not found then raise exception 'Stop the removal timer first'; end if;
  return row;
end $$;

revoke all on function public.reavers_app_start_removal(uuid, int, text), public.reavers_app_stop_removal(uuid, text),
  public.reavers_app_mark_removed(uuid), public.reavers_app_set_away(uuid, boolean) from public, anon;
grant execute on function public.reavers_app_start_removal(uuid, int, text), public.reavers_app_stop_removal(uuid, text),
  public.reavers_app_mark_removed(uuid), public.reavers_app_set_away(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------- for the Discord bot only (service role)

-- Who to message: the Discord account linked to their BuhurtOS sign-in (directly, through their club membership or through
-- their fighter profile), or the Discord ID typed into the tracker.
create or replace function public.reavers_app_bot_target(p_person uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
  with p as (select * from public.reavers_app_people where id = p_person),
  accounts as (
    select user_id from p where user_id is not null
    union all select m.user_id from p join public.club_memberships m on m.id = p.membership_id where m.user_id is not null
    union all select fa.user_id from p join public.fighter_accounts fa on fa.fighter_id = p.fighter_id
  )
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'status', p.status, 'removal_deadline', p.removal_deadline,
    'discord_id', coalesce(p.discord_id, (
      select i.provider_id from auth.identities i where i.provider = 'discord' and i.user_id in (select user_id from accounts) limit 1)))
  from p
$$;

-- Active people past 3 months without showing up whom leadership hasn't been told about for this absence, and timers that
-- ran out without anyone being told. Marks them as told.
create or replace function public.reavers_app_bot_daily()
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  no_shows jsonb;
  expired jsonb;
begin
  with due as (
    select p.id, p.name, coalesce(s.last_seen, p.started_on, p.created_at::date) as since, s.last_seen, p.last_contact_on
    from public.reavers_app_people p join public.reavers_app_people_stats s on s.person_id = p.id
    where p.status = 'active'
      and coalesce(s.last_seen, p.started_on, p.created_at::date) <= (current_date - interval '3 months')
  ), told as (
    update public.reavers_app_people p set no_show_alerted_for = due.since
    from due where p.id = due.id and p.no_show_alerted_for is distinct from due.since
    returning due.*
  )
  select coalesce(jsonb_agg(to_jsonb(told) order by since), '[]') into no_shows from told;

  with ran_out as (
    update public.reavers_app_people set removal_alerted_at = now()
    where status = 'removal' and removal_deadline <= current_date and removal_alerted_at is null
    returning id, name, removal_deadline, reply_text
  )
  select coalesce(jsonb_agg(to_jsonb(ran_out)), '[]') into expired from ran_out;

  return jsonb_build_object('no_shows', no_shows, 'expired', expired);
end $$;

create or replace function public.reavers_app_bot_dm_result(p_person uuid, p_error text)
returns void
language sql security definer set search_path = '' as $$
  update public.reavers_app_people set dm_sent_at = case when p_error is null then now() else dm_sent_at end, dm_error = p_error
  where id = p_person
$$;

-- The member's answer from Discord: kept on their record and counted as hearing from them.
create or replace function public.reavers_app_bot_reply(p_person uuid, p_discord_id text, p_text text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  target jsonb := public.reavers_app_bot_target(p_person);
  row public.reavers_app_people;
begin
  if target is null or target->>'discord_id' is distinct from p_discord_id then raise exception 'Not the person this was sent to'; end if;
  update public.reavers_app_people set reply_text = left(trim(p_text), 2000), reply_at = now(),
      last_contact_on = current_date, last_contact_note = 'Replied to the bot on Discord'
    where id = p_person returning * into row;
  return jsonb_build_object('name', row.name, 'status', row.status, 'removal_deadline', row.removal_deadline);
end $$;

revoke all on function public.reavers_app_bot_target(uuid), public.reavers_app_bot_daily(),
  public.reavers_app_bot_dm_result(uuid, text), public.reavers_app_bot_reply(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reavers_app_bot_target(uuid), public.reavers_app_bot_daily(),
  public.reavers_app_bot_dm_result(uuid, text), public.reavers_app_bot_reply(uuid, text, text) to service_role;

commit;

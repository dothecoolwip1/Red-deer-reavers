-- Reavers app: automatic reminders, by Discord and/or email.
--
--   reavers_app_reminder_settings  one row: what to send, when and how. Admins (treasury) change it on Team -> Reminders.
--   reavers_app_reminder_log       every reminder sent (or that failed), so nothing goes out twice and admins can see it.
--
-- What goes out (all off until an admin turns them on, except the leadership no-show post the bot already made):
--   dues       a Discord DM and/or email to each active club member who hasn't paid this month's dues, on a set day of the
--              month, and optionally a second nudge some days later. Payment-exempt months and paid/waived months skip.
--   practice   a post in the members' Discord channel and/or an email some hours before each weekly practice.
--   event      the same, some days before each public calendar event.
--   warning    a friendly Discord DM to a member some days before they reach 3 months without showing up.
--   no-show    the existing daily leadership post from the attendance bot, now with an on/off switch.
--
-- The reavers-reminders function (supabase/functions/reavers-reminders) runs hourly from pg_cron. It asks
-- reavers_app_reminders_due() what is due right now (in Red Deer time) and not already in the log, sends it, and writes the
-- results with reavers_app_reminders_record(). Only the service role can call those two.

begin;

create table public.reavers_app_reminder_settings (
  id int primary key default 1 check (id = 1),
  send_hour int not null default 9 check (send_hour between 6 and 21),               -- Red Deer time, for the daily sends
  dues_enabled boolean not null default false,
  dues_day int not null default 1 check (dues_day between 1 and 28),                  -- day of the month
  dues_followup_days int not null default 7 check (dues_followup_days between 0 and 20), -- 0 = no second nudge
  dues_via text not null default 'discord' check (dues_via in ('discord', 'email', 'both')),
  practice_enabled boolean not null default false,
  practice_hours_before int not null default 24 check (practice_hours_before between 1 and 72),
  practice_via text not null default 'discord' check (practice_via in ('discord', 'email', 'both')),
  events_enabled boolean not null default false,
  events_days_before int not null default 3 check (events_days_before between 1 and 30),
  events_via text not null default 'discord' check (events_via in ('discord', 'email', 'both')),
  noshow_enabled boolean not null default true,                                       -- the leadership channel post
  noshow_warn_enabled boolean not null default false,                                 -- the DM to the member
  noshow_warn_days int not null default 14 check (noshow_warn_days between 3 and 45),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
insert into public.reavers_app_reminder_settings (id) values (1) on conflict do nothing;
create index reavers_app_reminder_settings_updated_by_idx on public.reavers_app_reminder_settings (updated_by);

create table public.reavers_app_reminder_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dues', 'dues_followup', 'practice', 'event', 'noshow_warning')),
  ref text not null,                         -- what it was about: 'dues:2026-11-01:membership:<id>', 'practice:<id>:2026-11-16', ...
  via text not null check (via in ('discord', 'email')),
  recipient text not null default '',        -- a name, or "members channel"
  summary text not null default '',
  status text not null check (status in ('sent', 'skipped', 'failed')),  -- skipped: no Discord account or email to send to
  error text,
  sent_at timestamptz not null default now()
);
create unique index reavers_app_reminder_log_once_idx on public.reavers_app_reminder_log (kind, ref, via) where status <> 'failed';
create index reavers_app_reminder_log_sent_idx on public.reavers_app_reminder_log (sent_at desc);

alter table public.reavers_app_reminder_settings enable row level security;
alter table public.reavers_app_reminder_log enable row level security;
create policy "exec reads reminder settings" on public.reavers_app_reminder_settings for select to authenticated
  using ((select private.reavers_app_is_exec()));
create policy "admins change reminder settings" on public.reavers_app_reminder_settings for update to authenticated
  using ((select private.reavers_app_is_finance())) with check ((select private.reavers_app_is_finance()));
create policy "exec reads reminder log" on public.reavers_app_reminder_log for select to authenticated
  using ((select private.reavers_app_is_exec()));

grant select on public.reavers_app_reminder_settings, public.reavers_app_reminder_log to authenticated;
grant select on public.reavers_app_reminder_settings to service_role;   -- the attendance bot checks the no-show switch
grant update (send_hour, dues_enabled, dues_day, dues_followup_days, dues_via, practice_enabled, practice_hours_before, practice_via,
  events_enabled, events_days_before, events_via, noshow_enabled, noshow_warn_enabled, noshow_warn_days)
  on public.reavers_app_reminder_settings to authenticated;

create or replace function private.reavers_app_reminder_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
create trigger reavers_app_reminder_settings_stamp before update on public.reavers_app_reminder_settings
  for each row execute function private.reavers_app_reminder_stamp();

-- ---------------------------------------------------------------- for the reminders function only (service role)

-- Everything due at p_now (Red Deer time) that hasn't been sent yet. Each list carries the people's Discord ID and email.
create or replace function public.reavers_app_reminders_due(p_now timestamptz default now())
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.reavers_app_reminder_settings;
  v_team uuid := private.reavers_app_team();
  v_local timestamp := p_now at time zone 'America/Edmonton';
  v_today date := v_local::date;
  v_after_hour boolean;
  v_month date := date_trunc('month', v_today)::date;
  v_members jsonb := '[]';
  v_dues jsonb := '[]';
  v_practices jsonb := '[]';
  v_events jsonb := '[]';
  v_warnings jsonb := '[]';
  v_dues_kind text;
  v_price bigint;
begin
  select * into s from public.reavers_app_reminder_settings where id = 1;
  if not found then return jsonb_build_object('settings', null); end if;
  v_after_hour := extract(hour from v_local) >= s.send_hour;

  -- This year's active club members, with how to reach them.
  with yr as (
    select max(membership_year) as y from public.club_memberships
    where team_id = v_team and membership_year <= extract(year from v_today)
  ), m as (
    select cm.id, cm.full_name, cm.user_id from public.club_memberships cm, yr
    where cm.team_id = v_team and cm.membership_year = yr.y and cm.status = 'active'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'key', 'membership:' || m.id, 'name', m.full_name, 'user_id', m.user_id,
      'email', (select u.email from auth.users u where u.id = m.user_id),
      'discord_id', coalesce(
        (select p.discord_id from public.reavers_app_people p where p.membership_id = m.id and p.discord_id is not null limit 1),
        (select i.provider_id from auth.identities i where i.provider = 'discord' and i.user_id = m.user_id limit 1)))
    order by m.full_name), '[]')
  into v_members from m;

  -- Dues: on the set day (first reminder) and the follow-up day, from the send hour on, to anyone with nothing for this month.
  if s.dues_enabled and v_after_hour then
    v_dues_kind := case
      when s.dues_followup_days > 0 and extract(day from v_today) >= s.dues_day + s.dues_followup_days then 'dues_followup'
      when extract(day from v_today) >= s.dues_day then 'dues' end;
    if v_dues_kind is not null then
      select price_cents into v_price from public.reavers_app_square_items where kind = 'dues' and active order by sort_order limit 1;
      select coalesce(jsonb_agg(x || jsonb_build_object('kind', v_dues_kind, 'ref', 'dues:' || v_month || ':' || (x->>'key'), 'month', v_month, 'price_cents', v_price)), '[]')
      into v_dues
      from jsonb_array_elements(v_members) x
      where not exists (select 1 from public.reavers_app_dues d
                        where d.month = v_month and (d.member_key = x->>'key' or (x->>'user_id' is not null and d.member_user = (x->>'user_id')::uuid)))
        and not exists (select 1 from public.reavers_app_dues_exemptions e
                        where e.member_key = x->>'key' and e.starts_month <= v_month and (e.ends_month is null or v_month <= e.ends_month))
        and not exists (select 1 from public.reavers_app_reminder_log l
                        where (l.status <> 'failed' or l.sent_at > p_now - interval '6 hours') and l.kind = v_dues_kind and l.ref = 'dues:' || v_month || ':' || (x->>'key'));
    end if;
  end if;

  -- Practices: each active weekly practice starting within the next N hours (this week's or next week's date).
  if s.practice_enabled then
    with upcoming as (
      select pr.*, d.day, (d.day + pr.start_time) at time zone 'America/Edmonton' as starts_at
      from private.reavers_practices pr,
        lateral (select v_today + ((pr.weekday - extract(dow from v_today)::int + 7) % 7) + w * 7 as day from generate_series(0, 1) w) d
      where pr.active
    )
    select coalesce(jsonb_agg(jsonb_build_object(
        'ref', 'practice:' || n.id || ':' || n.day, 'day', n.day, 'label', n.label, 'start_time', n.start_time, 'end_time', n.end_time,
        'venue', n.venue, 'fee', n.fee) order by n.starts_at), '[]')
    into v_practices
    from upcoming n
    where n.starts_at > p_now and n.starts_at <= p_now + make_interval(hours => s.practice_hours_before)
      and not exists (select 1 from public.reavers_app_reminder_log l where (l.status <> 'failed' or l.sent_at > p_now - interval '6 hours') and l.kind = 'practice' and l.ref = 'practice:' || n.id || ':' || n.day);
  end if;

  -- Public calendar events: from N days before, at the send hour, until the day itself.
  if s.events_enabled and v_after_hour then
    select coalesce(jsonb_agg(jsonb_build_object(
        'ref', 'event:' || e.id || ':' || e.event_date, 'title', e.title, 'event_type', e.event_type, 'day', e.event_date,
        'start_time', e.start_time, 'end_time', e.end_time, 'location', e.location, 'details', e.details, 'href', e.href) order by e.event_date), '[]')
    into v_events
    from private.reavers_events e
    where e.is_public and e.event_date >= v_today and e.event_date - s.events_days_before <= v_today
      and not exists (select 1 from public.reavers_app_reminder_log l where (l.status <> 'failed' or l.sent_at > p_now - interval '6 hours') and l.kind = 'event' and l.ref = 'event:' || e.id || ':' || e.event_date);
  end if;

  -- Attendance warning: active people within N days of reaching 3 months since they were last seen (or started).
  if s.noshow_warn_enabled and v_after_hour then
    with p as (
      select pe.id, pe.name, coalesce(st.last_seen, pe.started_on, pe.created_at::date) as since
      from public.reavers_app_people pe join public.reavers_app_people_stats st on st.person_id = pe.id
      where pe.status = 'active'
    )
    select coalesce(jsonb_agg(jsonb_build_object(
        'ref', 'noshow_warning:' || p.id || ':' || p.since, 'person_id', p.id, 'name', p.name, 'since', p.since,
        'limit_on', (p.since + interval '3 months')::date,
        'discord_id', public.reavers_app_bot_target(p.id)->>'discord_id')), '[]')
    into v_warnings
    from p
    where (p.since + interval '3 months')::date > v_today
      and (p.since + interval '3 months')::date - s.noshow_warn_days <= v_today
      and not exists (select 1 from public.reavers_app_reminder_log l where (l.status <> 'failed' or l.sent_at > p_now - interval '6 hours') and l.kind = 'noshow_warning' and l.ref = 'noshow_warning:' || p.id || ':' || p.since);
  end if;

  return jsonb_build_object(
    'settings', to_jsonb(s) - 'updated_by', 'today', v_today,
    'members', case when s.practice_via <> 'discord' or s.events_via <> 'discord' then v_members else '[]' end,
    'dues', v_dues, 'practices', v_practices, 'events', v_events, 'warnings', v_warnings);
end $$;

-- What was sent: [{kind, ref, via, recipient, summary, status, error}]. A repeat of something already sent is ignored.
create or replace function public.reavers_app_reminders_record(p_rows jsonb)
returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.reavers_app_reminder_log (kind, ref, via, recipient, summary, status, error)
  select r->>'kind', r->>'ref', r->>'via', coalesce(r->>'recipient', ''), left(coalesce(r->>'summary', ''), 300),
         coalesce(r->>'status', 'failed'), left(r->>'error', 500)
  from jsonb_array_elements(p_rows) r
  on conflict do nothing;
  get diagnostics n = row_count;
  -- Keep a year of history.
  delete from public.reavers_app_reminder_log where sent_at < now() - interval '1 year';
  return n;
end $$;

revoke all on function public.reavers_app_reminders_due(timestamptz), public.reavers_app_reminders_record(jsonb) from public, anon, authenticated;
grant execute on function public.reavers_app_reminders_due(timestamptz), public.reavers_app_reminders_record(jsonb) to service_role;

commit;

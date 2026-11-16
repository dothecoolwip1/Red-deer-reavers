-- Reavers fighter profiles: what the club adds on top of a fighter's BuhurtOS profile for reddeerreavers.com
-- (weight class, team role, nickname, an action photo, a highlight video, personal sponsors, "open to sponsors").
-- BuhurtOS keeps the photo, disciplines, bio and the fight record; this table only holds the Reavers extras.
--
-- Who can change a profile: the fighter themselves (their BuhurtOS account is linked to the fighter in
-- public.fighter_accounts and they are on the Reavers team), or anyone who can use the app's Team page
-- (the executive by default, or whoever an admin gives it to). Apply after 20261111000000_reavers_app_page_access.sql.
--
-- Nothing shows on the website until show_on_site is turned on. Visitors (anon) can read only those rows, and only the
-- columns the site shows (never updated_by, which is an account id).

begin;

create table public.reavers_app_fighter_profiles (
  fighter_id uuid primary key references public.fighters (id) on delete cascade,
  show_on_site boolean not null default false,
  nickname text check (nickname is null or char_length(nickname) <= 40),
  weight_class text check (weight_class is null or char_length(weight_class) <= 40),
  team_role text check (team_role is null or char_length(team_role) <= 60),
  tagline text check (tagline is null or char_length(tagline) <= 140),
  about text check (about is null or char_length(about) <= 1500),
  -- an https address or a path on the site; never javascript:, data: or other schemes
  photo_url text check (photo_url is null or (char_length(photo_url) <= 2000 and photo_url ~* '^(https://[^\s]+|/(?!/)[^\s]*)$')),
  video_url text check (video_url is null or (char_length(video_url) <= 2000 and video_url ~* '^https://[^\s]+$')),
  sponsors text check (sponsors is null or char_length(sponsors) <= 300),
  open_to_sponsors boolean not null default false,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index reavers_app_fighter_profiles_updated_by_idx on public.reavers_app_fighter_profiles (updated_by);
create index reavers_app_fighter_profiles_shown_idx on public.reavers_app_fighter_profiles (fighter_id) where show_on_site;

-- True when the signed-in person is this fighter (their account is linked to it) and is on the Reavers team.
create or replace function private.reavers_app_is_my_fighter(p_fighter uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and private.reavers_app_is_member()
    and exists (select 1 from public.fighter_accounts fa where fa.fighter_id = p_fighter and fa.user_id = (select auth.uid()))
$$;

-- The same check for a storage folder name (text, so a folder that isn't a fighter id is simply refused).
create or replace function private.reavers_app_is_my_fighter_folder(p_folder text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and private.reavers_app_is_member()
    and exists (select 1 from public.fighter_accounts fa where fa.fighter_id::text = lower(p_folder) and fa.user_id = (select auth.uid()))
$$;

grant execute on function private.reavers_app_is_my_fighter(uuid), private.reavers_app_is_my_fighter_folder(text) to authenticated;

create or replace function private.reavers_app_fighter_profile_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
create trigger reavers_app_fighter_profile_stamp
  before insert or update on public.reavers_app_fighter_profiles
  for each row execute function private.reavers_app_fighter_profile_stamp();

-- The fighter profiles linked to the signed-in account, so the app can offer "My fighter profile".
create or replace function public.reavers_app_my_fighters()
returns table (fighter_id uuid, name text)
language sql stable security definer set search_path = '' as $$
  select f.id, coalesce(nullif(trim(f.display_name), ''), 'My fighter profile')
  from public.fighter_accounts fa
  join public.fighters f on f.id = fa.fighter_id
  where fa.user_id = (select auth.uid()) and private.reavers_app_is_member()
  order by 2
$$;
revoke all on function public.reavers_app_my_fighters() from public, anon;
grant execute on function public.reavers_app_my_fighters() to authenticated;

alter table public.reavers_app_fighter_profiles enable row level security;
create policy "anyone reads profiles shown on the site" on public.reavers_app_fighter_profiles for select to anon, authenticated
  using (show_on_site);
create policy "fighter or team page reads profiles" on public.reavers_app_fighter_profiles for select to authenticated
  using ((select private.reavers_app_is_my_fighter(fighter_id)) or (select private.reavers_app_can_view('team')));
create policy "fighter or team page adds profiles" on public.reavers_app_fighter_profiles for insert to authenticated
  with check ((select private.reavers_app_is_my_fighter(fighter_id)) or (select private.reavers_app_can_edit('team')));
create policy "fighter or team page updates profiles" on public.reavers_app_fighter_profiles for update to authenticated
  using ((select private.reavers_app_is_my_fighter(fighter_id)) or (select private.reavers_app_can_edit('team')))
  with check ((select private.reavers_app_is_my_fighter(fighter_id)) or (select private.reavers_app_can_edit('team')));
create policy "fighter or team page removes profiles" on public.reavers_app_fighter_profiles for delete to authenticated
  using ((select private.reavers_app_is_my_fighter(fighter_id)) or (select private.reavers_app_can_edit('team')));

grant select, insert, update, delete on public.reavers_app_fighter_profiles to authenticated;
grant select (fighter_id, show_on_site, nickname, weight_class, team_role, tagline, about, photo_url, video_url, sponsors,
              open_to_sponsors, updated_at) on public.reavers_app_fighter_profiles to anon;

-- Action photos go in the public site media bucket under fighters/<fighter id>/. The fighter can upload to their own
-- folder; the Team page can upload to any fighter's.
create policy "reavers fighter photo upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'reavers-site-media'
    and (storage.foldername(name))[1] = 'fighters'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and ((select private.reavers_app_can_edit('team'))
         or (select private.reavers_app_is_my_fighter_folder((storage.foldername(name))[2])))
  );

commit;

-- Reavers app: the social media manager (Growth -> Social media). Write a post once, pick the club's accounts, post it
-- now or schedule it, and see the links and likes afterwards.
--
--   reavers_app_social_accounts  the connected accounts: a Facebook Page, an Instagram professional account, a YouTube
--                                channel, a TikTok account, an X account, a Bluesky account, a Discord channel webhook.
--   reavers_app_social_tokens    each account's keys. Only the reavers-social function (service role) can read them; no
--                                screen and no signed-in person ever can.
--   reavers_app_social_oauth     a sign-in to a platform that's under way (15 minutes at most). Service role only.
--   reavers_app_social_posts     what to post: text, per-platform wording, photos or a video, a link, when, and a status.
--   reavers_app_social_targets   one row per account a post goes to: its own status, the live link, the error if it
--                                failed, and likes, comments, shares and views.
--   reavers-social-media         a public storage bucket for the photos and videos. Public because Facebook, Instagram
--                                and TikTok fetch the files themselves from the address we give them.
--
-- Who can do what: a new staff page, "social", on the Page access screen. The executive uses it by default; members don't
-- see it unless an admin gives it to them. Accounts are connected through the reavers-social function, which writes
-- them with the service role; a person with the page can disconnect one (its keys go with it).
--
-- Posting: pg_cron calls the function every 5 minutes. It claims what's due with reavers_app_social_claim(), posts it,
-- and writes each result to the target. A trigger keeps the post's status in step with its targets. Nothing existing
-- changes except that page access learns the new page.

begin;

-- ---------------------------------------------------------------- page access learns the new page

alter table public.reavers_app_page_access drop constraint if exists reavers_app_page_access_page_check;
alter table public.reavers_app_page_access add constraint reavers_app_page_access_page_check
  check (page in ('attendance', 'ledger', 'budget', 'sales', 'dues', 'tournaments', 'sponsors', 'grants', 'gear',
    'compliance', 'site', 'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr', 'social'));

create or replace function public.reavers_app_my_pages() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(p, private.reavers_app_page_level(p)), '{}'::jsonb)
  from unnest(array['attendance', 'ledger', 'budget', 'sales', 'dues', 'tournaments', 'sponsors', 'grants', 'gear',
                    'compliance', 'site', 'calendar', 'team', 'practices', 'inquiries', 'site-settings', 'qr', 'social']) p
$$;
revoke all on function public.reavers_app_my_pages() from public, anon;
grant execute on function public.reavers_app_my_pages() to authenticated;

-- ---------------------------------------------------------------- accounts and their keys

create table public.reavers_app_social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'x', 'bluesky', 'discord')),
  external_id text not null,              -- the Page id, Instagram user id, channel id, open_id, X user id, DID, webhook id
  name text not null default '',
  handle text,
  avatar_url text,
  profile_url text,
  status text not null default 'connected' check (status in ('connected', 'needs_reconnect')),
  last_error text,
  connected_by uuid references auth.users (id) on delete set null,
  connected_at timestamptz not null default now(),
  token_expires_at timestamptz,           -- when the platform will want a fresh sign-in (null: never, or refreshed on its own)
  unique (platform, external_id)
);
create index reavers_app_social_accounts_connected_by_idx on public.reavers_app_social_accounts (connected_by);

create table public.reavers_app_social_tokens (
  account_id uuid primary key references public.reavers_app_social_accounts (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  extra jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.reavers_app_social_oauth (
  state text primary key,
  platform text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  verifier text,                          -- PKCE (X)
  return_to text not null,
  created_at timestamptz not null default now()
);
create index reavers_app_social_oauth_user_idx on public.reavers_app_social_oauth (user_id);

-- ---------------------------------------------------------------- posts and where they go

create table public.reavers_app_social_posts (
  id uuid primary key default gen_random_uuid(),
  body text not null default '' check (length(body) <= 70000),
  texts jsonb not null default '{}',      -- { "x": "shorter wording", ... }
  media jsonb not null default '[]',      -- [{ url, path, kind, mime, size, name, alt }]
  link_url text check (link_url is null or link_url ~ '^https?://'),
  options jsonb not null default '{}',    -- { youtube_title, youtube_privacy, tiktok_privacy }
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'publishing', 'published', 'partial', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'scheduled' or scheduled_at is not null)
);
create index reavers_app_social_posts_due_idx on public.reavers_app_social_posts (scheduled_at) where status in ('scheduled', 'publishing');
create index reavers_app_social_posts_created_by_idx on public.reavers_app_social_posts (created_by);

create table public.reavers_app_social_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.reavers_app_social_posts (id) on delete cascade,
  account_id uuid references public.reavers_app_social_accounts (id) on delete set null,
  platform text not null check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'x', 'bluesky', 'discord')),
  account_name text not null default '',  -- kept so the history still reads after an account is disconnected
  status text not null default 'pending' check (status in ('pending', 'publishing', 'published', 'failed', 'skipped')),
  attempts int not null default 0,
  next_try_at timestamptz,
  external_id text,
  url text,
  error text,
  note text,                              -- said by the platform on success, e.g. "YouTube kept it private"
  published_at timestamptz,
  stats jsonb,                            -- { likes, comments, shares, views }
  stats_at timestamptz,
  unique (post_id, account_id)
);
create index reavers_app_social_targets_post_idx on public.reavers_app_social_targets (post_id);
create index reavers_app_social_targets_account_idx on public.reavers_app_social_targets (account_id);
create index reavers_app_social_targets_open_idx on public.reavers_app_social_targets (status) where status in ('pending', 'publishing', 'failed');

-- A post's status follows its targets (the same rule as rollup() in supabase/functions/_shared/social.ts).
create or replace function private.reavers_app_social_rollup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
  v_cur text;
  v_open int; v_tried int; v_ok int; v_bad int; v_all int;
  v_next text;
begin
  select status into v_cur from public.reavers_app_social_posts where id = v_post;
  if v_cur is null or v_cur in ('draft', 'cancelled') then return null; end if;
  select count(*) filter (where status in ('pending', 'publishing') or (status = 'failed' and attempts < 3)),
         count(*) filter (where attempts > 0),
         count(*) filter (where status = 'published'),
         count(*) filter (where status = 'failed'),
         count(*)
    into v_open, v_tried, v_ok, v_bad, v_all
    from public.reavers_app_social_targets where post_id = v_post;
  if v_all = 0 then return null; end if;
  v_next := case
    when v_open > 0 then case when v_tried > 0 then 'publishing' else 'scheduled' end
    when v_ok = 0 then case when v_bad > 0 then 'failed' else 'published' end
    when v_bad > 0 then 'partial'
    else 'published' end;
  update public.reavers_app_social_posts
     set status = v_next,
         published_at = case when v_next in ('published', 'partial') then coalesce(published_at, now()) else published_at end
   where id = v_post and status is distinct from v_next;
  return null;
end $$;
create trigger reavers_app_social_targets_rollup after insert or update or delete on public.reavers_app_social_targets
  for each row execute function private.reavers_app_social_rollup();

create or replace function private.reavers_app_social_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger reavers_app_social_posts_stamp before update on public.reavers_app_social_posts
  for each row execute function private.reavers_app_social_stamp();

-- Once an account has been tried, the post is history: its text and media can't change any more (a retry posts the same thing).
create or replace function private.reavers_app_social_lock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- The function (service role) has no signed-in person; it only changes the status.
  if (select auth.uid()) is null then return new; end if;
  if exists (select 1 from public.reavers_app_social_targets t where t.post_id = old.id and t.attempts > 0)
     and (new.body is distinct from old.body or new.texts is distinct from old.texts or new.media is distinct from old.media
          or new.link_url is distinct from old.link_url or new.options is distinct from old.options) then
    raise exception 'This post has already gone out to some accounts, so it can''t be changed. Copy it into a new post instead.';
  end if;
  return new;
end $$;
create trigger reavers_app_social_posts_lock before update on public.reavers_app_social_posts
  for each row execute function private.reavers_app_social_lock();

-- ---------------------------------------------------------------- who can do what

alter table public.reavers_app_social_accounts enable row level security;
alter table public.reavers_app_social_tokens enable row level security;
alter table public.reavers_app_social_oauth enable row level security;
alter table public.reavers_app_social_posts enable row level security;
alter table public.reavers_app_social_targets enable row level security;

create policy "social page reads accounts" on public.reavers_app_social_accounts for select to authenticated
  using ((select private.reavers_app_can_view('social')));
create policy "social page disconnects accounts" on public.reavers_app_social_accounts for delete to authenticated
  using ((select private.reavers_app_can_edit('social')));
create policy "social page reads posts" on public.reavers_app_social_posts for select to authenticated
  using ((select private.reavers_app_can_view('social')));
create policy "social page writes posts" on public.reavers_app_social_posts for all to authenticated
  using ((select private.reavers_app_can_edit('social'))) with check ((select private.reavers_app_can_edit('social')));
create policy "social page reads targets" on public.reavers_app_social_targets for select to authenticated
  using ((select private.reavers_app_can_view('social')));
-- Picking accounts: only on a post nobody has tried posting yet. Results are written by the function.
create policy "social page picks accounts" on public.reavers_app_social_targets for insert to authenticated
  with check ((select private.reavers_app_can_edit('social')) and status = 'pending' and attempts = 0
              and exists (select 1 from public.reavers_app_social_posts p where p.id = post_id and p.status in ('draft', 'scheduled')));
create policy "social page unpicks accounts" on public.reavers_app_social_targets for delete to authenticated
  using ((select private.reavers_app_can_edit('social')) and attempts = 0);
-- Tokens and sign-ins in progress: no policy, so nobody signed in can read them. The function uses the service role.

grant select, delete on public.reavers_app_social_accounts to authenticated;
grant select, insert, update, delete on public.reavers_app_social_posts to authenticated;
grant select, insert, delete on public.reavers_app_social_targets to authenticated;
grant all on public.reavers_app_social_accounts, public.reavers_app_social_tokens, public.reavers_app_social_oauth,
  public.reavers_app_social_posts, public.reavers_app_social_targets to service_role;

-- ---------------------------------------------------------------- for the reavers-social function only (service role)

-- Takes what's due at p_now and marks it publishing, so two runs never post the same thing. A run that died mid-post
-- (publishing for over 30 minutes) is counted as failed and tried again.
create or replace function public.reavers_app_social_claim(p_now timestamptz default now(), p_limit int default 6)
returns setof public.reavers_app_social_targets
language plpgsql security definer set search_path = '' as $$
begin
  update public.reavers_app_social_targets t
     set status = 'failed', error = coalesce(t.error, 'Stopped partway; trying again'), next_try_at = p_now
   where t.status = 'publishing' and t.next_try_at < p_now - interval '30 minutes';

  return query
  with due as (
    select t.id from public.reavers_app_social_targets t
      join public.reavers_app_social_posts p on p.id = t.post_id
     where p.status in ('scheduled', 'publishing') and p.scheduled_at <= p_now and t.account_id is not null
       and (t.status = 'pending' or (t.status = 'failed' and t.attempts < 3 and coalesce(t.next_try_at, p_now) <= p_now))
     order by p.scheduled_at, t.id
     limit p_limit
     for update of t skip locked
  )
  update public.reavers_app_social_targets t
     set status = 'publishing', attempts = t.attempts + 1, next_try_at = p_now, error = null
    from due where t.id = due.id
  returning t.*;
end $$;

revoke all on function public.reavers_app_social_claim(timestamptz, int) from public, anon, authenticated;
grant execute on function public.reavers_app_social_claim(timestamptz, int) to service_role;

-- ---------------------------------------------------------------- photos and videos

-- 500 MB per file. A self-hosted server also has its own limit (FILE_SIZE_LIMIT in the server's .env, 50 MB by default):
-- raise it there for longer videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reavers-social-media', 'reavers-social-media', true, 524288000,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "reavers social media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'reavers-social-media' and (select private.reavers_app_can_edit('social')));
create policy "reavers social media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'reavers-social-media' and (select private.reavers_app_can_edit('social')));

commit;

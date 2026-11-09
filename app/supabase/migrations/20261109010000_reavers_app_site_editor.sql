-- Site editor: text and image changes to reddeerreavers.com made in the Reavers app (Site editor).
-- The public site reads this table with the anon key (site-content.js); only the executive can change it.
-- Apply after 20261109000000_reavers_app.sql.

begin;

create table public.reavers_app_site_content (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page ~ '^[a-z0-9-]+\.html$'),
  key text not null check (key ~ '^(txt|img):[a-z0-9]+$'),
  kind text not null check (kind in ('text', 'image')),
  value text not null check (char_length(value) <= 5000),
  original text not null default '',
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (page, key),
  -- images: an https address or a path on the site; never javascript:, data: or other schemes
  check (kind = 'text' or value ~* '^(https://|/(?!/)|[a-z0-9._-]+/)')
);
create index reavers_app_site_content_updated_by_idx on public.reavers_app_site_content (updated_by);

-- Every published change keeps the version it replaced, so the editor can show history and restore.
create table public.reavers_app_site_content_history (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  key text not null,
  kind text not null,
  value text,                                         -- null: the change put the original back
  previous text,
  original text not null default '',
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index reavers_app_site_content_history_page_idx on public.reavers_app_site_content_history (page, changed_at desc);
create index reavers_app_site_content_history_by_idx on public.reavers_app_site_content_history (changed_by);

create or replace function private.reavers_app_site_content_log() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    insert into public.reavers_app_site_content_history (page, key, kind, value, previous, original, changed_by)
      values (old.page, old.key, old.kind, null, old.value, old.original, (select auth.uid()));
    return old;
  end if;
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  insert into public.reavers_app_site_content_history (page, key, kind, value, previous, original, changed_by)
    values (new.page, new.key, new.kind, new.value, case when tg_op = 'UPDATE' then old.value end, new.original, (select auth.uid()));
  return new;
end $$;

create trigger reavers_app_site_content_log
  before insert or update or delete on public.reavers_app_site_content
  for each row execute function private.reavers_app_site_content_log();

alter table public.reavers_app_site_content enable row level security;
alter table public.reavers_app_site_content_history enable row level security;

create policy "anyone reads published site content" on public.reavers_app_site_content for select to anon, authenticated using (true);
create policy "exec edits site content" on public.reavers_app_site_content for insert to authenticated with check ((select private.reavers_app_is_exec()));
create policy "exec updates site content" on public.reavers_app_site_content for update to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
create policy "exec removes site content" on public.reavers_app_site_content for delete to authenticated using ((select private.reavers_app_is_exec()));
create policy "exec reads site history" on public.reavers_app_site_content_history for select to authenticated using ((select private.reavers_app_is_exec()));

grant select on public.reavers_app_site_content to anon;

-- Public bucket for images uploaded in the editor (logos, photos). Anyone can view; only the executive uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reavers-site-media', 'reavers-site-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do nothing;

create policy "reavers site media exec upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'reavers-site-media' and (select private.reavers_app_is_exec()));

commit;

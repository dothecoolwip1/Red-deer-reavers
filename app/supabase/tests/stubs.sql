do $$ begin if not exists (select from pg_roles where rolname=$q$anon$q$) then create role anon nologin; create role authenticated nologin; end if; end $$;
create schema auth; create schema private; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id text primary key default gen_random_uuid()::text, bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
create table public.teams(id uuid primary key, slug text);
create table public.team_officers(id uuid default gen_random_uuid(), team_id uuid, user_id uuid, office text, started_on date, ended_on date);
create table public.team_memberships_stub(team_id uuid, user_id uuid);
create table public.captains_stub(team_id uuid, user_id uuid);
create function private.is_owner() returns boolean language sql stable security definer as $$ select false $$;
create function private.is_team_captain(p uuid) returns boolean language sql stable security definer as $$ select exists(select 1 from public.captains_stub where team_id=p and user_id=auth.uid()) $$;
create function private.is_team_member(p uuid, u uuid) returns boolean language sql stable security definer as $$ select exists(select 1 from public.team_memberships_stub where team_id=p and user_id=u) $$;
grant usage on schema auth, private, storage to authenticated, anon;
grant execute on all functions in schema auth to authenticated, anon;
insert into public.teams values ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68','red-deer-reavers');
-- users: 1 treasurer, 2 president, 3 secretary, 4 member, 5 outsider
insert into auth.users select ('00000000-0000-0000-0000-00000000000'||i)::uuid from generate_series(1,5) i;
insert into public.team_officers(team_id,user_id,office) values
 ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68','00000000-0000-0000-0000-000000000001','treasurer'),
 ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68','00000000-0000-0000-0000-000000000002','president'),
 ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68','00000000-0000-0000-0000-000000000003','secretary');
insert into public.team_memberships_stub values ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68','00000000-0000-0000-0000-000000000004');

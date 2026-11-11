-- Reavers app: sponsors on the public website, and the "become a sponsor" form.
--
--   * Each sponsor in the app can now carry a logo, a short public line and a "show on the website" switch. The website's
--     Sponsors page (reddeerreavers.com/sponsors.html) lists the signed and renewed sponsors that have the switch on,
--     grouped by tier. It reads them through public.reavers_sponsors_public(), which returns only those public fields
--     (name, tier, website, logo, line), never contacts, amounts or notes.
--   * The website's "Become a sponsor" form calls public.reavers_sponsor_inquiry(). It adds the business to the app's
--     sponsor pipeline as a prospect marked "from the website", where it also shows on the app's Inquiries page. The
--     function checks the fields, ignores bots that fill the hidden field, and limits how many can arrive at once.
--   * Whoever can use the app's Sponsors page can upload logos to the public site media bucket, under sponsors/.
--
-- Nothing existing changes: four new columns with defaults, two functions, one storage policy.

begin;

alter table public.reavers_app_sponsors
  add column if not exists logo_url text,
  add column if not exists blurb text,
  add column if not exists show_on_site boolean not null default false,
  add column if not exists source text not null default 'app';

alter table public.reavers_app_sponsors drop constraint if exists reavers_app_sponsors_source_check;
alter table public.reavers_app_sponsors add constraint reavers_app_sponsors_source_check check (source in ('app', 'website'));
alter table public.reavers_app_sponsors drop constraint if exists reavers_app_sponsors_logo_url_check;
alter table public.reavers_app_sponsors add constraint reavers_app_sponsors_logo_url_check
  check (logo_url is null or logo_url ~* '^https://');
alter table public.reavers_app_sponsors drop constraint if exists reavers_app_sponsors_blurb_check;
alter table public.reavers_app_sponsors add constraint reavers_app_sponsors_blurb_check check (blurb is null or length(blurb) <= 280);

create index if not exists reavers_app_sponsors_public_idx on public.reavers_app_sponsors (show_on_site) where show_on_site;

-- The website's list: signed or renewed sponsors that are switched on, public fields only.
create or replace function public.reavers_sponsors_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', s.name,
           'tier', s.tier,
           'in_kind', s.in_kind,
           'website', case when s.website ~* '^https?://' then s.website end,
           'logo_url', case when s.logo_url ~* '^https://' then s.logo_url end,
           'blurb', s.blurb)
         order by case lower(coalesce(s.tier, ''))
                    when 'gold' then 1 when 'silver' then 2 when 'bronze' then 3 when 'in-kind' then 4 else 5 end,
                  s.name), '[]'::jsonb)
  from public.reavers_app_sponsors s
  where s.show_on_site and s.stage in ('signed', 'renewed')
$$;
revoke all on function public.reavers_sponsors_public() from public;
grant execute on function public.reavers_sponsors_public() to anon, authenticated;

-- The website's "Become a sponsor" form. p: { name, contact_name, email, phone, website, tier, message, trap }.
create or replace function public.reavers_sponsor_inquiry(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p->>'name', '')), 160);
  v_contact text := nullif(left(btrim(coalesce(p->>'contact_name', '')), 120), '');
  v_email text := nullif(left(lower(btrim(coalesce(p->>'email', ''))), 200), '');
  v_phone text := nullif(left(btrim(coalesce(p->>'phone', '')), 40), '');
  v_site text := nullif(left(btrim(coalesce(p->>'website', '')), 300), '');
  v_tier text := nullif(btrim(coalesce(p->>'tier', '')), '');
  v_message text := nullif(left(btrim(coalesce(p->>'message', '')), 3000), '');
begin
  -- A bot filled the hidden field: say thanks and keep nothing.
  if coalesce(btrim(p->>'trap'), '') <> '' then return jsonb_build_object('ok', true); end if;
  if v_name = '' then raise exception 'Please add the name of your business or organization.' using errcode = '22023'; end if;
  if v_email is null and v_phone is null then raise exception 'Please add an email or phone number so we can reply.' using errcode = '22023'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email address does not look right.' using errcode = '22023'; end if;
  if v_site is not null and v_site !~* '^https?://' then v_site := 'https://' || v_site; end if;
  if v_tier is not null and v_tier not in ('Gold', 'Silver', 'Bronze', 'In-kind') then v_tier := null; end if;

  -- Flood guard: at most 30 website inquiries an hour, and the same email or business once every 10 minutes.
  if (select count(*) from public.reavers_app_sponsors where source = 'website' and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'We are getting a lot of sponsor messages right now. Please email reddeerreavers@gmail.com instead.' using errcode = '53400';
  end if;
  if exists (select 1 from public.reavers_app_sponsors
             where source = 'website' and created_at > now() - interval '10 minutes'
               and (lower(name) = lower(v_name) or (v_email is not null and lower(email) = v_email))) then
    return jsonb_build_object('ok', true);
  end if;

  insert into public.reavers_app_sponsors (name, contact_name, email, phone, website, stage, tier, source, next_follow_up, notes)
  values (v_name, v_contact, v_email, v_phone, v_site, 'prospect', v_tier, 'website',
          (now() at time zone 'America/Edmonton')::date + 2,
          'From the website sponsor form' || case when v_message is not null then E':\n' || v_message else '.' end);
  return jsonb_build_object('ok', true);
end
$$;
revoke all on function public.reavers_sponsor_inquiry(jsonb) from public;
grant execute on function public.reavers_sponsor_inquiry(jsonb) to anon, authenticated;

-- Sponsor logos: whoever can use the Sponsors page can upload into sponsors/ in the public site media bucket.
drop policy if exists "reavers sponsor logos upload" on storage.objects;
create policy "reavers sponsor logos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'reavers-site-media' and (storage.foldername(name))[1] = 'sponsors'
              and (select private.reavers_app_can_edit('sponsors')));

commit;

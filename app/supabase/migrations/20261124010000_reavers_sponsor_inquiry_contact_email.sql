-- The sponsor form's busy message now names the club's current address, info@reddeerreavers.com.
-- Same function as 20261112000000_reavers_app_sponsors_public.sql, only that message changed.

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
    raise exception 'We are getting a lot of sponsor messages right now. Please email info@reddeerreavers.com instead.' using errcode = '53400';
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

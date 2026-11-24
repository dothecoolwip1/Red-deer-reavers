\set u1 '00000000-0000-0000-0000-000000000001'
\set u2 '00000000-0000-0000-0000-000000000002'
\set u3 '00000000-0000-0000-0000-000000000003'
\set u4 '00000000-0000-0000-0000-000000000004'
\set u5 '00000000-0000-0000-0000-000000000005'
set role authenticated;
select set_config('test.uid', :'u1', false); select 'u1 role', reavers_app_my_role();
select set_config('test.uid', :'u3', false); select 'u3 role', reavers_app_my_role();
select set_config('test.uid', :'u4', false); select 'u4 role', reavers_app_my_role();
select set_config('test.uid', :'u5', false); select 'u5 role', reavers_app_my_role();
-- treasurer writes ledger
select set_config('test.uid', :'u1', false);
insert into reavers_app_transactions(date,description,amount_cents) values ('2026-11-01','Rent',-40000);
-- secretary reads, cannot write
select set_config('test.uid', :'u3', false);
select 'u3 sees ledger rows', count(*) from reavers_app_transactions;
\set ON_ERROR_STOP 0
insert into reavers_app_transactions(date,description,amount_cents) values ('2026-11-01','Hack',100);
\set ON_ERROR_STOP 1
-- member sees nothing in ledger, files a claim
select set_config('test.uid', :'u4', false);
select 'u4 sees ledger rows', count(*) from reavers_app_transactions;
insert into reavers_app_reimbursements(submitter_name,description,amount_cents) values ('Member','Tape',30000);
select 'u4 own claims', count(*) from reavers_app_reimbursements;
\set ON_ERROR_STOP 0
select reavers_app_approve_reimbursement((select id from reavers_app_reimbursements limit 1));
insert into reavers_app_waivers(season, full_name, signed_name) values (2026,'Mem Ber','Someone Else');
\set ON_ERROR_STOP 1
insert into reavers_app_waivers(season, full_name, signed_name) values (2026,'Mem Ber','mem ber');
-- outsider sees no claims, cannot file
select set_config('test.uid', :'u5', false);
select 'u5 claims visible', count(*) from reavers_app_reimbursements;
\set ON_ERROR_STOP 0
insert into reavers_app_reimbursements(submitter_name,description,amount_cents) values ('X','x',100);
\set ON_ERROR_STOP 1
-- approvals: u1 approves -> still submitted (needs 2), u1 again -> stays, u2 -> approved, then pay
select set_config('test.uid', :'u1', false);
select 'after u1', reavers_app_approve_reimbursement((select id from reavers_app_reimbursements limit 1));
select set_config('test.uid', :'u2', false);
select 'after u2', reavers_app_approve_reimbursement((select id from reavers_app_reimbursements limit 1));
select 'paid tx', reavers_app_pay_reimbursement((select id from reavers_app_reimbursements limit 1)) is not null;
select 'ledger', description, amount_cents, source from reavers_app_transactions order by created_at;
-- secretary sees waivers, member u4 cannot see others; storage
select set_config('test.uid', :'u3', false); select 'u3 waivers', count(*) from reavers_app_waivers;
select set_config('test.uid', :'u4', false);
insert into storage.objects(bucket_id,name) values ('reavers-app-receipts', :'u4' || '/r.jpg');
\set ON_ERROR_STOP 0
insert into storage.objects(bucket_id,name) values ('reavers-app-receipts', :'u1' || '/r.jpg');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u5', false); select 'u5 receipts visible', count(*) from storage.objects;
-- site editor: anon reads, members cannot write, exec writes, history kept, unsafe image values refused
select set_config('test.uid', :'u3', false);
insert into reavers_app_site_content(page, key, kind, value, original) values ('index.html', 'txt:abc', 'text', 'Fight with us', 'Train together.');
update reavers_app_site_content set value = 'Fight with the Reavers' where key = 'txt:abc';
\set ON_ERROR_STOP 0
insert into reavers_app_site_content(page, key, kind, value) values ('index.html', 'img:x1', 'image', 'javascript:alert(1)');
\set ON_ERROR_STOP 1
select 'site history', count(*) from reavers_app_site_content_history;
select set_config('test.uid', :'u4', false);
\set ON_ERROR_STOP 0
update reavers_app_site_content set value = 'hacked' where key = 'txt:abc';
insert into reavers_app_site_content(page, key, kind, value) values ('index.html', 'txt:zz', 'text', 'x');
\set ON_ERROR_STOP 1
select 'member history visible', count(*) from reavers_app_site_content_history;
reset role;
set role anon;
select set_config('test.uid', '', false);
select 'anon reads', value from reavers_app_site_content;
\set ON_ERROR_STOP 0
select updated_by from reavers_app_site_content;
\set ON_ERROR_STOP 1
-- Square: anon sees only public items; finance manages items and dues; payments are written by the webhook only
reset role;
insert into reavers_app_square_items(title, kind, price_cents, public) values ('Visitor fee','visitor',500,true), ('Monthly dues','dues',3000,false);
insert into reavers_app_square_payments(square_payment_id, paid_at, status, amount_cents, kind, member_user) values
  ('P1', now(), 'COMPLETED', 3000, 'dues', '00000000-0000-0000-0000-000000000004'), ('P2', now(), 'COMPLETED', 500, 'other', null);
insert into reavers_app_transactions(date, description, amount_cents, category, account, source, external_id) values
  (current_date, 'Square: Other from card reader', 500, 'Other', 'Square', 'square', 'square-P2-other'),
  (current_date, 'Square processing fee', -15, 'Fees', 'Square', 'square', 'square-P2-fee');
set role anon;
select 'anon items', string_agg(title, ',') from reavers_app_square_items;
\set ON_ERROR_STOP 0
select count(*) from reavers_app_square_payments;
\set ON_ERROR_STOP 1
reset role;
set role authenticated;
select set_config('test.uid', :'u4', false);
select 'member items', count(*) from reavers_app_square_items;
select 'member own payments', count(*) from reavers_app_square_payments;
\set ON_ERROR_STOP 0
insert into reavers_app_dues(member_key, member_name, month, method) values ('user:x', 'Me', '2026-11-01', 'cash');
insert into reavers_app_square_payments(square_payment_id, paid_at, status, amount_cents, kind) values ('FAKE', now(), 'COMPLETED', 1, 'other');
select reavers_app_square_set_kind((select id from reavers_app_square_payments where square_payment_id = 'P2'), 'visitor');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u3', false);
select 'exec payments', count(*) from reavers_app_square_payments;
select set_config('test.uid', :'u1', false);
insert into reavers_app_dues(member_key, member_name, member_user, month, method, amount_cents) values ('membership:1', 'Mem Ber', :'u4', '2026-11-01', 'cash', 3000);
\set ON_ERROR_STOP 0
insert into reavers_app_dues(member_key, member_name, month, method) values ('membership:1', 'Mem Ber', '2026-11-01', 'cash');
insert into reavers_app_dues(member_key, member_name, month, method) values ('membership:1', 'Mem Ber', '2026-11-15', 'cash');
\set ON_ERROR_STOP 1
select reavers_app_square_set_kind((select id from reavers_app_square_payments where square_payment_id = 'P2'), 'visitor');
select 'relabelled', kind from reavers_app_square_payments where square_payment_id = 'P2';
select 'ledger follows', category, amount_cents from reavers_app_transactions where external_id like 'square-P2-%' order by amount_cents;
select set_config('test.uid', :'u4', false);
select 'member own dues', count(*) from reavers_app_dues;
-- Dues exemptions: treasury sets them, the executive reads them, members neither
select set_config('test.uid', :'u1', false);
insert into reavers_app_dues_exemptions(member_key, member_name, reason, starts_month) values ('membership:1', 'Mem Ber', 'Coach', '2026-11-01');
\set ON_ERROR_STOP 0
insert into reavers_app_dues_exemptions(member_key, member_name, starts_month, ends_month) values ('membership:2', 'X', '2026-11-01', '2026-10-01');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u3', false);
select 'exec exemptions', count(*) from reavers_app_dues_exemptions;
\set ON_ERROR_STOP 0
insert into reavers_app_dues_exemptions(member_key, member_name) values ('membership:3', 'Y');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u4', false);
select 'member exemptions', count(*) from reavers_app_dues_exemptions;
-- attendance: exec only; the removal timer only through its functions; the bot functions only for the service role
reset role;
insert into public.club_memberships values ('10000000-0000-0000-0000-000000000004', :'u4');
insert into auth.identities(user_id, provider, provider_id) values (:'u4', 'discord', '123456789012345678');
set role authenticated;
select set_config('test.uid', :'u3', false);
insert into reavers_app_people(name, membership_id, started_on) values ('Mem Ber', '10000000-0000-0000-0000-000000000004', current_date - 400);
insert into reavers_app_people(name, started_on) values ('Regular', current_date - 400);
insert into reavers_app_gatherings(kind, title, date) values ('practice', 'Old practice', current_date - 200), ('practice', 'Last week', current_date - 7), ('fundraiser', 'Bottle drive', current_date - 20);
insert into reavers_app_attendance(gathering_id, person_id) select g.id, p.id from reavers_app_gatherings g, reavers_app_people p where p.name = 'Mem Ber' and g.title = 'Old practice';
insert into reavers_app_attendance(gathering_id, person_id) select g.id, p.id from reavers_app_gatherings g, reavers_app_people p where p.name = 'Regular' and g.title <> 'Old practice';
reset role;
select id as mem from reavers_app_people where name = 'Mem Ber' \gset
set role authenticated;
select 'stats', p.name, s.total, s.practices, s.fundraisers, s.recent, s.last_practice = current_date - 7 from reavers_app_people_stats s join reavers_app_people p on p.id = s.person_id order by p.name;
\set ON_ERROR_STOP 0
update reavers_app_people set status = 'removed' where name = 'Mem Ber';
select reavers_app_start_removal(:'mem', 3);
select reavers_app_bot_daily();
\set ON_ERROR_STOP 1
select 'timer', status, removal_deadline = current_date + 30 from reavers_app_start_removal(:'mem', 30, 'No practice since spring');
select 'mem set', set_config('test.mem', :'mem', false) is not null;
do $$ begin perform reavers_app_mark_removed(current_setting('test.mem')::uuid); raise notice 'removed too early';
exception when raise_exception then raise notice 'too early refused: %', sqlerrm ~ '^The timer runs until'; end $$;
select set_config('test.uid', :'u4', false);
select 'member sees people', count(*) from reavers_app_people;
\set ON_ERROR_STOP 0
select reavers_app_stop_removal((select id from reavers_app_people limit 1));
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'bot target', reavers_app_bot_target(:'mem')->>'discord_id';
\set ON_ERROR_STOP 0
select reavers_app_bot_reply(:'mem', '999999999999999999', 'not me');
\set ON_ERROR_STOP 1
select 'bot reply', reavers_app_bot_reply(:'mem', '123456789012345678', 'Hurt my knee, back in January')->>'status';
reset role;
update reavers_app_people set status = 'active', removal_deadline = null, removal_started_at = null where name = 'Mem Ber';
set role service_role;
select 'daily', jsonb_array_length(reavers_app_bot_daily()->'no_shows');
select 'daily again', jsonb_array_length(reavers_app_bot_daily()->'no_shows');
reset role;
update reavers_app_people set status = 'removal', removal_started_at = now(), removal_deadline = current_date where name = 'Mem Ber';
set role service_role;
select 'expired', reavers_app_bot_daily()->'expired'->0->>'reply_text';
reset role;
set role authenticated;
select set_config('test.uid', :'u3', false);
select 'removed', status from reavers_app_mark_removed(:'mem');
select 'kept', status from reavers_app_stop_removal(:'mem', 'Back in January');
-- page access: admins (treasury) give or take pages per person; the tables follow, not just the menu
reset role;
insert into public.team_roles values ('a87fcf7c-c3a3-4fb6-b373-9c0b61676d68', :'u4', 'member', null);
insert into public.profiles values (:'u4', 'Mem Ber'), (:'u3', 'Sec Retary');
set role authenticated;
select set_config('test.uid', :'u3', false);
select 'exec default pages', reavers_app_my_pages()->>'ledger', reavers_app_my_pages()->>'sponsors', reavers_app_my_pages()->>'attendance';
\set ON_ERROR_STOP 0
select reavers_app_access_people();
insert into reavers_app_page_access(user_id, page, access) values (:'u3', 'ledger', 'edit');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u4', false);
select 'member default pages', reavers_app_my_pages()->>'sponsors', reavers_app_my_pages()->>'gear';
select 'member sees sponsors before', count(*) from reavers_app_sponsors;
select set_config('test.uid', :'u1', false);
insert into reavers_app_sponsors(name) values ('Red Deer Brewing');
select 'admin people', name, role from reavers_app_access_people() order by name;
-- give the member Sponsors and view-only Ledger; take Sponsors and Attendance away from the secretary
insert into reavers_app_page_access(user_id, page, access) values
  (:'u4', 'sponsors', 'edit'), (:'u4', 'ledger', 'view'), (:'u3', 'sponsors', 'none'), (:'u3', 'attendance', 'none');
\set ON_ERROR_STOP 0
insert into reavers_app_page_access(user_id, page, access) values (:'u4', 'nonsense', 'edit');
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u4', false);
select 'member pages now', reavers_app_my_pages()->>'sponsors', reavers_app_my_pages()->>'ledger', reavers_app_my_pages()->>'gear';
select 'member sees sponsors after', count(*) from reavers_app_sponsors;
insert into reavers_app_sponsors(name) values ('Gym down the road');
select 'member sees ledger rows now', count(*) > 0 from reavers_app_transactions;
\set ON_ERROR_STOP 0
insert into reavers_app_transactions(date, description, amount_cents) values (current_date, 'Not allowed', 1);
insert into reavers_app_page_access(user_id, page, access) values (:'u4', 'gear', 'edit');
\set ON_ERROR_STOP 1
select 'member sees own access rows', count(*) from reavers_app_page_access;
select set_config('test.uid', :'u3', false);
select 'secretary sees sponsors', count(*) from reavers_app_sponsors;
select 'secretary sees people', count(*) from reavers_app_people;
select 'secretary still has grants', reavers_app_my_pages()->>'grants';
\set ON_ERROR_STOP 0
insert into reavers_app_sponsors(name) values ('Sneaky');
select reavers_app_set_away(:'mem', true);
\set ON_ERROR_STOP 1
-- an admin can't be locked out, and removing the override puts the role default back
select set_config('test.uid', :'u1', false);
insert into reavers_app_page_access(user_id, page, access) values (:'u1', 'ledger', 'none');
select 'admin keeps ledger', reavers_app_my_pages()->>'ledger';
delete from reavers_app_page_access where user_id = :'u3' and page = 'sponsors';
select set_config('test.uid', :'u3', false);
select 'secretary sponsors back', count(*) from reavers_app_sponsors;
-- QR codes: the executive adds and reads them; members can't; only web links
reset role;
set role authenticated;
select set_config('test.uid', :'u3', false);
insert into reavers_app_qr_codes(title, url) values ('Tournament signup', 'https://app.reddeerreavers.com/#/buy');
\set ON_ERROR_STOP 0
insert into reavers_app_qr_codes(title, url) values ('Bad', 'javascript:alert(1)');
\set ON_ERROR_STOP 1
select 'exec qr codes', count(*) from reavers_app_qr_codes;
select set_config('test.uid', :'u4', false);
select 'member qr codes', count(*) from reavers_app_qr_codes;
\set ON_ERROR_STOP 0
insert into reavers_app_qr_codes(title, url) values ('Sneaky', 'https://example.com');
\set ON_ERROR_STOP 1
-- Merch store: anyone reads in-store items (for sale, on the open page); treasury sets photos (https only); the executive can't
reset role;
insert into reavers_app_square_items(title, kind, price_cents, public, in_store) values
  ('Store sticker', 'sticker', 300, true, true), ('Members tee', 'other', 2500, false, true), ('Not listed', 'sticker', 500, true, false);
set role anon;
select 'anon store items', string_agg(title, ',' order by title) from reavers_app_square_items where in_store;
reset role;
set role authenticated;
select set_config('test.uid', :'u1', false);
update reavers_app_square_items set image_url = 'https://api-home.buhurtoshome.app/storage/v1/object/public/reavers-site-media/2026/s.webp' where title = 'Store sticker';
\set ON_ERROR_STOP 0
update reavers_app_square_items set image_url = 'javascript:alert(1)' where title = 'Store sticker';
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u3', false);
update reavers_app_square_items set in_store = false where title = 'Store sticker';
reset role;
select 'store sticker after exec', in_store, image_url like 'https://%' from reavers_app_square_items where title = 'Store sticker';
-- Sponsors on the website: the public sees only signed sponsors switched on, and only their public fields
reset role;
set role authenticated;
select set_config('test.uid', :'u1', false);
insert into reavers_app_sponsors(name, stage, tier, email, value_cents, show_on_site, logo_url, website) values
  ('Shown Gold', 'signed', 'Gold', 'secret@x.com', 100000, true, 'https://cdn.example.com/a.png', 'https://shown.example.com'),
  ('Shown Bronze', 'renewed', 'Bronze', null, null, true, null, 'javascript:alert(1)'),
  ('Hidden signed', 'signed', 'Silver', null, null, false, null, null),
  ('Prospect on', 'prospect', 'Gold', null, null, true, null, null);
\set ON_ERROR_STOP 0
update reavers_app_sponsors set logo_url = 'javascript:alert(1)' where name = 'Shown Gold';
\set ON_ERROR_STOP 1
reset role;
set role anon;
select set_config('test.uid', '', false);
select 'public sponsors', jsonb_array_length(reavers_sponsors_public()), reavers_sponsors_public()->0->>'name', reavers_sponsors_public()->1->>'website' is null;
select 'public sponsors hide contacts', reavers_sponsors_public()::text like '%secret%' or reavers_sponsors_public()::text like '%100000%';
\set ON_ERROR_STOP 0
select count(*) from reavers_app_sponsors;
select reavers_sponsor_inquiry('{"name":"", "email":"a@b.co"}');
select reavers_sponsor_inquiry('{"name":"No contact"}');
\set ON_ERROR_STOP 1
select 'inquiry', reavers_sponsor_inquiry('{"name":"Prairie Coffee","contact_name":"Jo","email":"Jo@Prairie.ca","website":"prairie.ca","tier":"Silver","message":"Love the sport"}')->>'ok';
select 'inquiry repeat ignored', reavers_sponsor_inquiry('{"name":"Prairie Coffee","email":"jo@prairie.ca"}')->>'ok';
select 'inquiry bot ignored', reavers_sponsor_inquiry('{"name":"Spam Co","email":"s@s.co","trap":"http://spam"}')->>'ok';
reset role;
select 'website prospects', name, stage, source, tier, email, website, notes from reavers_app_sponsors where source = 'website' order by name;
-- Fighter profiles: a fighter edits their own; the Team page edits any; visitors see only profiles turned on, never updated_by
reset role;
insert into public.fighters(id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Member Fighter'), ('22222222-2222-2222-2222-222222222222', 'Other Fighter');
insert into public.fighter_accounts(fighter_id, user_id) values ('11111111-1111-1111-1111-111111111111', :'u4'), ('22222222-2222-2222-2222-222222222222', :'u5');
set role authenticated;
select set_config('test.uid', :'u4', false);
select 'member my fighters', count(*) from reavers_app_my_fighters();
insert into reavers_app_fighter_profiles(fighter_id, nickname, weight_class) values ('11111111-1111-1111-1111-111111111111', 'The Anvil', 'Heavyweight');
\set ON_ERROR_STOP 0
insert into reavers_app_fighter_profiles(fighter_id, nickname) values ('22222222-2222-2222-2222-222222222222', 'Not mine');
insert into reavers_app_fighter_profiles(fighter_id, photo_url) values ('11111111-1111-1111-1111-111111111111', 'javascript:alert(1)');
\set ON_ERROR_STOP 1
update reavers_app_fighter_profiles set photo_url = 'https://example.com/a.jpg' where fighter_id = '11111111-1111-1111-1111-111111111111';
select 'member stamped', updated_by = :'u4' from reavers_app_fighter_profiles;
insert into storage.objects(bucket_id, name) values ('reavers-site-media', 'fighters/11111111-1111-1111-1111-111111111111/action.jpg');
\set ON_ERROR_STOP 0
insert into storage.objects(bucket_id, name) values ('reavers-site-media', 'fighters/22222222-2222-2222-2222-222222222222/action.jpg');
insert into storage.objects(bucket_id, name) values ('reavers-site-media', 'fighters/not-a-fighter/action.jpg');
\set ON_ERROR_STOP 1
-- an outsider linked to a fighter is not on the team, so can't add a profile
select set_config('test.uid', :'u5', false);
select 'outsider my fighters', count(*) from reavers_app_my_fighters();
\set ON_ERROR_STOP 0
insert into reavers_app_fighter_profiles(fighter_id, nickname) values ('22222222-2222-2222-2222-222222222222', 'Outsider');
\set ON_ERROR_STOP 1
select 'outsider sees hidden profiles', count(*) from reavers_app_fighter_profiles;
-- the executive (Team page) edits anyone's
select set_config('test.uid', :'u3', false);
select 'exec sees profiles', count(*) from reavers_app_fighter_profiles;
insert into reavers_app_fighter_profiles(fighter_id, team_role) values ('22222222-2222-2222-2222-222222222222', 'Line fighter');
update reavers_app_fighter_profiles set show_on_site = true where fighter_id = '11111111-1111-1111-1111-111111111111';
insert into storage.objects(bucket_id, name) values ('reavers-site-media', 'fighters/22222222-2222-2222-2222-222222222222/action.jpg');
reset role;
set role anon;
select 'visitor sees shown profiles', count(*) from reavers_app_fighter_profiles;
select 'visitor reads extras', nickname, weight_class from reavers_app_fighter_profiles;
\set ON_ERROR_STOP 0
select updated_by from reavers_app_fighter_profiles;
\set ON_ERROR_STOP 1
-- Reminders: the executive reads the settings, only admins change them; members see nothing
reset role;
update auth.users set email = 'u' || right(id::text, 1) || '@example.com';
insert into public.club_memberships(id, user_id, team_id, membership_year, status, full_name) values
 ('30000000-0000-0000-0000-000000000002', :'u2', 'a87fcf7c-c3a3-4fb6-b373-9c0b61676d68', 2026, 'active', 'Paid Up'),
 ('30000000-0000-0000-0000-000000000003', :'u3', 'a87fcf7c-c3a3-4fb6-b373-9c0b61676d68', 2026, 'active', 'Exempt Coach'),
 ('30000000-0000-0000-0000-000000000004', :'u4', 'a87fcf7c-c3a3-4fb6-b373-9c0b61676d68', 2026, 'active', 'Owes Dues'),
 ('30000000-0000-0000-0000-000000000005', :'u5', 'a87fcf7c-c3a3-4fb6-b373-9c0b61676d68', 2026, 'removed', 'Gone Now');
insert into reavers_app_dues(member_key, member_name, month, amount_cents, method) values ('membership:30000000-0000-0000-0000-000000000002', 'Paid Up', '2026-12-01', 2500, 'cash');
insert into reavers_app_dues_exemptions(member_key, member_name, starts_month) values ('membership:30000000-0000-0000-0000-000000000003', 'Exempt Coach', '2026-09-01');
insert into private.reavers_practices(weekday, label, start_time, end_time, venue) values (0, 'Sunday', '17:00', '20:00', 'Springbrook');
insert into private.reavers_events(title, event_type, event_date, is_public) values ('Demo day', 'demo', '2026-12-07', true), ('Exec meeting', 'meeting', '2026-12-06', false);
set role authenticated;
select set_config('test.uid', :'u4', false);
select 'member sees reminder settings', count(*) from reavers_app_reminder_settings;
select set_config('test.uid', :'u3', false);
select 'exec sees reminder settings', count(*) from reavers_app_reminder_settings;
update reavers_app_reminder_settings set dues_enabled = true;
select 'exec could not turn on dues', dues_enabled from reavers_app_reminder_settings;
\set ON_ERROR_STOP 0
select reavers_app_reminders_due();
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u1', false);
update reavers_app_reminder_settings set dues_enabled = true, practice_enabled = true, events_enabled = true, noshow_warn_enabled = true;
select 'admin turned them on', dues_enabled, practice_enabled, updated_by = :'u1' from reavers_app_reminder_settings;
reset role;
set role service_role;
-- Saturday Dec 5 2026, 10 AM in Red Deer: dues (only the member who owes), the demo 2 days out, no practice yet (31 h away)
select 'due sat 10am dues', jsonb_agg(x->>'name') from jsonb_array_elements(reavers_app_reminders_due('2026-12-05 17:00+00')->'dues') x;
select 'due sat 10am discord', reavers_app_reminders_due('2026-12-05 17:00+00')->'dues'->0->>'discord_id';
select 'due sat 10am events', jsonb_agg(x->>'title') from jsonb_array_elements(reavers_app_reminders_due('2026-12-05 17:00+00')->'events') x;
select 'due sat 10am practices', jsonb_array_length(reavers_app_reminders_due('2026-12-05 17:00+00')->'practices');
-- before the send hour nothing daily goes out
select 'due sat 7am dues', jsonb_array_length(reavers_app_reminders_due('2026-12-05 14:00+00')->'dues');
-- Saturday 5:30 PM: Sunday's practice is under 24 h away
select 'due sat 530pm practice', reavers_app_reminders_due('2026-12-06 00:30+00')->'practices'->0->>'day';
-- once recorded, it isn't due again; a failure doesn't count as sent
select 'recorded', reavers_app_reminders_record('[{"kind":"dues","ref":"dues:2026-12-01:membership:30000000-0000-0000-0000-000000000004","via":"discord","recipient":"Owes Dues","status":"sent"},
  {"kind":"event","ref":"event:x","via":"email","status":"failed","error":"no key"}]'::jsonb);
select 'recorded twice', reavers_app_reminders_record('[{"kind":"dues","ref":"dues:2026-12-01:membership:30000000-0000-0000-0000-000000000004","via":"discord","status":"sent"}]'::jsonb);
select 'dues after send', jsonb_array_length(reavers_app_reminders_due('2026-12-05 17:00+00')->'dues');
-- a week later the follow-up is due for them again
select 'followup dec 8', reavers_app_reminders_due('2026-12-08 17:00+00')->'dues'->0->>'kind';
reset role;
set role authenticated;
select set_config('test.uid', :'u3', false);
select 'exec sees log', count(*) from reavers_app_reminder_log;
select set_config('test.uid', :'u4', false);
select 'member sees log', count(*) from reavers_app_reminder_log;
-- Event sign-ups: the executive sets them up; the public sees spots, not names; Square payments mark registrations paid
reset role;
set role authenticated;
select set_config('test.uid', :'u3', false);
insert into reavers_app_event_signups(id, event_id, title, event_date, capacity) values
  ('00000000-0000-0000-0000-0000000000e1', 'ev-1', 'Spring Melee', current_date + 10, 3);
insert into reavers_app_event_tickets(id, signup_id, title, kind, price_cents, max_per_order) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Fighter registration', 'tournament', 4000, 1),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'Visitor', 'visitor', 0, 4);
select set_config('test.uid', :'u4', false);
select 'member sees signups', count(*) from reavers_app_event_signups;
\set ON_ERROR_STOP 0
insert into reavers_app_event_tickets(signup_id, title) values ('00000000-0000-0000-0000-0000000000e1', 'Sneaky');
select reavers_app_event_reserve('00000000-0000-0000-0000-0000000000f1', 1, 'Me', 'me@example.com');
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'reserve paid', status, amount_cents from reavers_app_event_reserve('00000000-0000-0000-0000-0000000000f1', 1, 'Riley Hart', 'riley@example.com');
select 'reserve free', status, quantity from reavers_app_event_reserve('00000000-0000-0000-0000-0000000000f2', 2, 'Sam', '');
\set ON_ERROR_STOP 0
select reavers_app_event_reserve('00000000-0000-0000-0000-0000000000f2', 1, 'Too many', '');
\set ON_ERROR_STOP 1
update reavers_app_event_registrations set square_order_id = 'ord-ev-1' where name = 'Riley Hart';
reset role;
set role anon;
select 'public spots', e->>'spots_left', jsonb_array_length(e->'tickets') from jsonb_array_elements(reavers_app_event_public()) e;
\set ON_ERROR_STOP 0
select count(*) from reavers_app_event_registrations;
\set ON_ERROR_STOP 1
reset role;
insert into reavers_app_square_payments(square_payment_id, square_order_id, paid_at, status, amount_cents, kind)
  values ('pay-ev-1', 'ord-ev-1', now(), 'COMPLETED', 4000, 'tournament');
select 'after payment', status, paid_via from reavers_app_event_registrations where name = 'Riley Hart';
select id as riley from reavers_app_event_registrations where name = 'Riley Hart' \gset
set role anon;
select 'status page', reavers_app_event_registration_status(:'riley')->>'status';
reset role;
update reavers_app_square_payments set refunded_cents = 4000 where square_payment_id = 'pay-ev-1';
select 'after refund', status from reavers_app_event_registrations where name = 'Riley Hart';
set role authenticated;
select set_config('test.uid', :'u3', false);
insert into reavers_app_event_registrations(signup_id, ticket_title, kind, name, status, paid_via, amount_cents)
  values ('00000000-0000-0000-0000-0000000000e1', 'Visitor', 'visitor', 'Walk-up', 'paid', 'cash', 1000);
\set ON_ERROR_STOP 0
insert into reavers_app_event_registrations(signup_id, ticket_title, kind, name, status, paid_via)
  values ('00000000-0000-0000-0000-0000000000e1', 'Visitor', 'visitor', 'Fake', 'paid', 'square');
delete from reavers_app_event_signups where id = '00000000-0000-0000-0000-0000000000e1';
\set ON_ERROR_STOP 1
select 'exec sees registrations', count(*) from reavers_app_event_registrations;
select set_config('test.uid', :'u4', false);
select 'member sees registrations', count(*) from reavers_app_event_registrations;
-- Tournaments: treasury edits, the executive views (unless an admin says otherwise), members don't see it
reset role;
set role authenticated;
select set_config('test.uid', :'u1', false);
insert into reavers_app_tournaments(code, name, year, fighter_fee_cents) values ('TEST-2027', 'Test Cup', 2027, 4000);
insert into reavers_app_tournament_fighters(tournament_id, name, fee_cents, method, paid_cents, status)
  select id, 'Fighter A', 4000, 'cash', 4000, 'paid' from reavers_app_tournaments where code = 'TEST-2027';
insert into reavers_app_tournament_cash_boxes(tournament_id, name, opening, closing, counted)
  select id, 'Door', '{"2000": 5}', '{"2000": 7}', true from reavers_app_tournaments where code = 'TEST-2027';
insert into reavers_app_transactions(date, description, amount_cents, source, external_id) values ('2026-11-15', 'TEST-2027: fighter fees (cash)', 4000, 'tournament', 'tournament-TEST-2027-fees-cash');
\set ON_ERROR_STOP 0
insert into reavers_app_tournament_fighters(tournament_id, name, status)
  select id, 'Bad status', 'maybe' from reavers_app_tournaments where code = 'TEST-2027';
insert into reavers_app_tournaments(code, name, year) values ('bad code!', 'X', 2027);
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u3', false);
select 'exec tournaments level', reavers_app_my_pages()->>'tournaments';
select 'exec sees tournaments', (select count(*) from reavers_app_tournaments where code like 'TEST%'), (select count(*) from reavers_app_tournament_fighters), (select count(*) from reavers_app_tournament_cash_boxes);
\set ON_ERROR_STOP 0
insert into reavers_app_tournament_fighters(tournament_id, name) select id, 'Exec add' from reavers_app_tournaments where code = 'TEST-2027';
\set ON_ERROR_STOP 1
update reavers_app_tournaments set fights = 99 where code = 'TEST-2027';
select set_config('test.uid', :'u4', false);
select 'member tournaments level', reavers_app_my_pages()->>'tournaments';
select 'member sees tournaments', (select count(*) from reavers_app_tournaments), (select count(*) from reavers_app_tournament_fighters);
-- An admin gives a member view of the page
select set_config('test.uid', :'u1', false);
insert into reavers_app_page_access(user_id, page, access) values (:'u4', 'tournaments', 'view');
select set_config('test.uid', :'u4', false);
select 'member given view', reavers_app_my_pages()->>'tournaments', (select count(*) from reavers_app_tournament_fighters);
reset role;
select 'fights after exec update', fights is null from reavers_app_tournaments where code = 'TEST-2027';
select 'rumble seeded', code, fighters_count, divisions, fights, stream_minutes from reavers_app_tournaments where code = 'RUMBLE-2026';
-- Social media manager: the executive uses it, members don't see it, nobody signed in reads the keys
insert into reavers_app_social_accounts(id, platform, external_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'facebook', '123', 'Reavers Page');
insert into reavers_app_social_tokens(account_id, access_token) values ('00000000-0000-0000-0000-0000000000a1', 'SECRET');
set role authenticated;
select set_config('test.uid', :'u3', false);
select 'exec social level', reavers_app_my_pages()->>'social';
select 'exec sees social accounts', count(*) from reavers_app_social_accounts;
insert into reavers_app_social_posts(id, body, status, scheduled_at) values ('00000000-0000-0000-0000-0000000000b1', 'Practice Sunday', 'scheduled', now());
insert into reavers_app_social_targets(post_id, account_id, platform, account_name) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'facebook', 'Reavers Page');
\set ON_ERROR_STOP 0
select 'exec reads tokens', count(*) from reavers_app_social_tokens;
insert into reavers_app_social_accounts(platform, external_id, name) values ('x', '9', 'Fake');
insert into reavers_app_social_targets(post_id, account_id, platform, status) values ('00000000-0000-0000-0000-0000000000b1', null, 'x', 'published');
select reavers_app_social_claim();
\set ON_ERROR_STOP 1
select set_config('test.uid', :'u4', false);
select 'member social level', reavers_app_my_pages()->>'social';
select 'member sees social', (select count(*) from reavers_app_social_posts), (select count(*) from reavers_app_social_accounts);
\set ON_ERROR_STOP 0
insert into reavers_app_social_posts(body) values ('Member post');
\set ON_ERROR_STOP 1
-- The function claims it (once), posts it, and the post's status follows
reset role;
select 'claimed', count(*) from reavers_app_social_claim();
select 'claimed again', count(*) from reavers_app_social_claim();
select 'post while publishing', status from reavers_app_social_posts where id = '00000000-0000-0000-0000-0000000000b1';
update reavers_app_social_targets set status = 'published', url = 'https://www.facebook.com/123_4' where post_id = '00000000-0000-0000-0000-0000000000b1';
select 'post after publishing', status, published_at is not null from reavers_app_social_posts where id = '00000000-0000-0000-0000-0000000000b1';
-- Once it's gone out it can't be rewritten or have its accounts taken away
set role authenticated;
select set_config('test.uid', :'u3', false);
\set ON_ERROR_STOP 0
update reavers_app_social_posts set body = 'Changed' where id = '00000000-0000-0000-0000-0000000000b1';
\set ON_ERROR_STOP 1
delete from reavers_app_social_targets where post_id = '00000000-0000-0000-0000-0000000000b1';
select 'targets kept', count(*) from reavers_app_social_targets;
-- Disconnecting takes the keys with it and keeps the history
delete from reavers_app_social_accounts where id = '00000000-0000-0000-0000-0000000000a1';
reset role;
select 'after disconnect', (select count(*) from reavers_app_social_tokens), (select count(*) from reavers_app_social_targets where account_id is null and account_name = 'Reavers Page');

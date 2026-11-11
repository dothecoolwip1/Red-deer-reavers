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

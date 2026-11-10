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

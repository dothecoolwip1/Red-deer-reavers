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

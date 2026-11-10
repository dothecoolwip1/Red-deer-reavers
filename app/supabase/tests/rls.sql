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

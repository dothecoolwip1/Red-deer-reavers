-- Red Deer Rumble 2026 (RUMBLE-2026): everyone on the payments list, from "Rumble 2026 payments - tidy.xlsx".
-- 56 people: 21 paid, 4 still owe, 22 didn't need to pay and 9 had the fee waived. $1,000 expected, $840 received.
-- Apply after 20261116010000_reavers_app_tournaments_rumble_2026.sql
-- (SQL editor on the home server, then the cloud copy). Running it again adds nothing.

insert into public.reavers_app_tournament_fighters (tournament_id, name, fee_cents, method, paid_cents, status, note)
select t.id, v.name, v.fee_cents, v.method, v.paid_cents, v.status, v.note
from public.reavers_app_tournaments t
cross join (values
  ('A. Bird', 0, null, 0, 'not_needed', null),
  ('Alexa Lacroix', 0, null, 0, 'not_needed', null),
  ('Alister baker', 4000, 'etransfer', 4000, 'paid', null),
  ('Andrew villeneuve', 4000, 'etransfer', 4000, 'paid', null),
  ('Brandon Robertson', 4000, 'etransfer', 4000, 'paid', null),
  ('Brian Boisson', 0, null, 0, 'not_needed', null),
  ('Brittany Scobie', 0, null, 0, 'not_needed', null),
  ('Broden Brett', 4000, 'etransfer', 4000, 'paid', null),
  ('Buck bright', 4000, 'etransfer', 4000, 'paid', null),
  ('Carl Dumas', 0, null, 0, 'waived', null),
  ('Claire Bastien', 0, null, 0, 'not_needed', null),
  ('Colt Spencer', 4000, 'etransfer', 0, 'owes', null),
  ('Colum Terry', 4000, 'cash', 4000, 'paid', 'Listed as Cash, but the Paid? note says "Paid $40 EMT". Check which one it was.'),
  ('Corey Irwin', 4000, 'etransfer', 4000, 'paid', null),
  ('Diane Tetlock', 0, null, 0, 'not_needed', null),
  ('Dmitry Golivets', 0, null, 0, 'waived', 'Fee waived, but the Paid? note says "Paid $40 EMT". Refund, or count it as extra?'),
  ('Dylan Gibson', 0, null, 0, 'waived', null),
  ('Dylon Anderson', 4000, 'cash', 4000, 'paid', null),
  ('Gabrielle Primeau', 4000, 'etransfer', 4000, 'paid', null),
  ('Gage Cutler', 4000, 'etransfer', 0, 'owes', null),
  ('Gemariah Ongteco', 0, null, 0, 'not_needed', null),
  ('Harris Witherden', 0, null, 0, 'waived', null),
  ('Isabelle Prosser', 0, null, 0, 'not_needed', null),
  ('Jackson Lowe', 4000, 'cash', 4000, 'paid', null),
  ('Jasmine Greenwood', 0, null, 0, 'not_needed', null),
  ('Julian Kresz', 0, null, 0, 'waived', null),
  ('Katie Love', 4000, 'etransfer', 4000, 'paid', null),
  ('Keara Beaulieu', 0, null, 0, 'not_needed', null),
  ('Kedrixx Streit', 4000, 'cash', 4000, 'paid', null),
  ('Kella McKenzie', 0, null, 0, 'not_needed', null),
  ('Keston Piche', 0, null, 0, 'not_needed', null),
  ('Kolby Verkirk', 4000, 'cash', 0, 'owes', null),
  ('Madison Aitken', 4000, 'etransfer', 4000, 'paid', null),
  ('Matthias Hahnel', 4000, 'etransfer', 4000, 'paid', null),
  ('Mel Bolin', 0, null, 0, 'not_needed', null),
  ('Micah Alexander', 4000, 'etransfer', 4000, 'paid', null),
  ('Michael Nadtochii', 4000, 'etransfer', 4000, 'paid', null),
  ('Michaela Crump', 0, null, 0, 'not_needed', null),
  ('Mike Diaz', 0, null, 0, 'not_needed', null),
  ('Nevan Ondrus', 4000, 'etransfer', 4000, 'paid', null),
  ('Nolan Bernard', 4000, 'etransfer', 0, 'owes', null),
  ('Patrick depaulo', 0, null, 0, 'waived', null),
  ('Raheem Brown', 0, null, 0, 'not_needed', null),
  ('Reimounto tziotis', 0, null, 0, 'waived', null),
  ('Ryley Kingham', 0, null, 0, 'not_needed', null),
  ('Samantha Turner', 0, null, 0, 'not_needed', null),
  ('Stuart Witherden', 0, null, 0, 'waived', null),
  ('Taylor Robson', 0, null, 0, 'not_needed', null),
  ('Tripp Kerr', 4000, 'cash', 4000, 'paid', null),
  ('Tylor Prather', 0, null, 0, 'waived', null),
  ('Vince Spezzaferro', 0, null, 0, 'not_needed', null),
  ('Walker Block', 4000, 'etransfer', 4000, 'paid', null),
  ('Warren Neilson', 4000, 'cash', 4000, 'paid', null),
  ('Wayne Tetlock', 0, null, 0, 'not_needed', null),
  ('Will Downey', 4000, 'etransfer', 4000, 'paid', null),
  ('William Baliko', 0, null, 0, 'not_needed', null)
) as v(name, fee_cents, method, paid_cents, status, note)
where t.code = 'RUMBLE-2026'
  and not exists (select 1 from public.reavers_app_tournament_fighters f where f.tournament_id = t.id and f.name = v.name);

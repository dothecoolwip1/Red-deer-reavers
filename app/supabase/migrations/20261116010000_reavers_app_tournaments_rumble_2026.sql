-- Reavers app: the first edition on the Tournaments page, Red Deer Rumble 2026 (RUMBLE-2026), with its stats.
-- Apply after 20261116000000_reavers_app_tournaments.sql. Running it again changes nothing.
--
-- Only the event and its stats are here, because this repository is public. The fighter list (names and who paid) is
-- loaded separately from the project's files (tournaments/rumble-2026-fighters.sql). Sales come in from Square on the
-- page (Add from Square sales, or Import a Square export), and the cash box counts and expenses are entered there.

insert into public.reavers_app_tournaments
  (code, name, year, starts_on, ends_on, venue, fighter_fee_cents, fighters_count, divisions, fights, spectators,
   stream_viewers, stream_minutes, notes)
values
  ('RUMBLE-2026', 'Red Deer Rumble', 2026, '2026-11-14', '2026-11-15', null, 4000, 37, 16, 159,
   '[{"day": "Saturday", "count": 52}, {"day": "Sunday", "count": 42}]'::jsonb,
   189, 21 * 60 + 50,
   'Visitors $10 (52 Saturday, 42 Sunday: $940). Square, Nov 14-15: $1,047 in sales ($331 card, $716 cash), $6.72 in fees. Twitch: 189 unique viewers over 21h 50m.')
on conflict (code) do nothing;

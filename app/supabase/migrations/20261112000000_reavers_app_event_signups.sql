-- Reavers app: sign-ups and tickets for the website's calendar events, paid through Square.
--
--   reavers_app_event_signups        one per calendar event that takes sign-ups (the event itself stays in BuhurtOS's
--                                    public.reavers_site; event_id is its id). Open or closed, a closing date, an overall
--                                    cap and which extra questions to ask.
--   reavers_app_event_tickets        what people can sign up for at that event: "Fighter registration $40", "Visitor $10",
--                                    "Volunteer (free)". Each has a price (0 = free), an optional cap and a kind for the books.
--   reavers_app_event_registrations  everyone who signed up. Written by the reavers-event-signup function (service role)
--                                    through reavers_app_event_reserve(), and by staff for walk-ups at the door.
--
-- Paid tickets go through Square's checkout. When Square's webhook records the payment in reavers_app_square_payments,
-- a trigger here finds the registration by its Square order and marks it paid (or refunded), so the webhook itself
-- doesn't change. The payment lands in the ledger like any other Square sale (tournament → Event entry,
-- visitor → Admissions).
--
-- Who can do what: the public sees open sign-ups through reavers_app_event_public() (no names, only spots left).
-- Anyone who can see the app's Calendar page (or Square sales) sees registrations; anyone who can use Calendar sets up
-- sign-ups, checks people in, marks cash and adds walk-ups. Nothing existing changes.

begin;

create table public.reavers_app_event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique check (length(event_id) between 1 and 100),
  title text not null check (length(title) between 1 and 200),       -- copied from the calendar when sign-ups are saved
  event_date date not null,
  start_time text,
  location text,
  intro text check (length(intro) <= 2000),                         -- shown above the sign-up form
  open boolean not null default true,
  closes_on date,                                                   -- last day to sign up; null = through the event day
  capacity int check (capacity is null or capacity between 1 and 5000), -- everyone across all tickets; null = no cap
  ask_phone boolean not null default false,
  ask_club boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_event_signups_created_by_idx on public.reavers_app_event_signups (created_by);
create index reavers_app_event_signups_date_idx on public.reavers_app_event_signups (event_date);

create table public.reavers_app_event_tickets (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null references public.reavers_app_event_signups (id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  kind text not null default 'visitor' check (kind in ('tournament', 'visitor', 'other')),
  description text check (length(description) <= 1000),
  price_cents bigint not null default 0 check (price_cents >= 0 and price_cents <= 100000),
  capacity int check (capacity is null or capacity between 1 and 5000),
  max_per_order int not null default 1 check (max_per_order between 1 and 20),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index reavers_app_event_tickets_signup_idx on public.reavers_app_event_tickets (signup_id);

create table public.reavers_app_event_registrations (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null references public.reavers_app_event_signups (id) on delete restrict,
  ticket_id uuid references public.reavers_app_event_tickets (id) on delete set null,
  ticket_title text not null,
  kind text not null check (kind in ('tournament', 'visitor', 'other')),
  quantity int not null default 1 check (quantity between 1 and 20),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  name text not null check (length(name) between 1 and 120),
  email text check (length(email) <= 200),
  phone text check (length(phone) <= 40),
  club text check (length(club) <= 120),
  note text check (length(note) <= 1000),
  -- pending: sent to Square, not paid yet. paid: Square or the door took the money. free: no charge.
  status text not null default 'pending' check (status in ('pending', 'paid', 'free', 'cancelled', 'refunded')),
  paid_via text check (paid_via in ('square', 'cash', 'etransfer', 'other')),
  square_order_id text unique,
  square_payment_id text,
  paid_at timestamptz,
  checked_in_at timestamptz,
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_event_registrations_signup_idx on public.reavers_app_event_registrations (signup_id);
create index reavers_app_event_registrations_ticket_idx on public.reavers_app_event_registrations (ticket_id);
create index reavers_app_event_registrations_added_by_idx on public.reavers_app_event_registrations (added_by);

alter table public.reavers_app_event_signups enable row level security;
alter table public.reavers_app_event_tickets enable row level security;
alter table public.reavers_app_event_registrations enable row level security;

create policy "calendar page reads signups" on public.reavers_app_event_signups for select to authenticated
  using ((select private.reavers_app_can_view('calendar')));
create policy "calendar page writes signups" on public.reavers_app_event_signups for all to authenticated
  using ((select private.reavers_app_can_edit('calendar'))) with check ((select private.reavers_app_can_edit('calendar')));
create policy "calendar page reads tickets" on public.reavers_app_event_tickets for select to authenticated
  using ((select private.reavers_app_can_view('calendar')));
create policy "calendar page writes tickets" on public.reavers_app_event_tickets for all to authenticated
  using ((select private.reavers_app_can_edit('calendar'))) with check ((select private.reavers_app_can_edit('calendar')));
create policy "calendar or sales page reads registrations" on public.reavers_app_event_registrations for select to authenticated
  using ((select private.reavers_app_can_view('calendar')) or (select private.reavers_app_can_view('sales')));
-- Staff add walk-ups as paid at the door or free; only Square marks something paid by Square.
create policy "calendar page adds walk-ups" on public.reavers_app_event_registrations for insert to authenticated
  with check ((select private.reavers_app_can_edit('calendar')) and status in ('paid', 'free')
              and coalesce(paid_via, 'cash') <> 'square' and square_order_id is null);
create policy "calendar page updates registrations" on public.reavers_app_event_registrations for update to authenticated
  using ((select private.reavers_app_can_edit('calendar'))) with check ((select private.reavers_app_can_edit('calendar')));
create policy "calendar page removes registrations" on public.reavers_app_event_registrations for delete to authenticated
  using ((select private.reavers_app_can_edit('calendar')) and status in ('pending', 'cancelled', 'free')
         or (select private.reavers_app_can_edit('calendar')) and status = 'paid' and coalesce(paid_via, '') <> 'square');

grant select, insert, update, delete on public.reavers_app_event_signups, public.reavers_app_event_tickets,
  public.reavers_app_event_registrations to authenticated;
-- The reavers-event-signup function (service role) saves the Square order on a registration, or drops it if Square fails.
grant select, insert, update, delete on public.reavers_app_event_signups, public.reavers_app_event_tickets,
  public.reavers_app_event_registrations to service_role;

-- ---------------------------------------------------------------- spots

-- How many places a registration holds: paid and free ones, and pending ones for 45 minutes (someone at Square's page).
create or replace function private.reavers_app_event_holds(r public.reavers_app_event_registrations) returns boolean
language sql stable set search_path = '' as $$
  select r.status in ('paid', 'free') or (r.status = 'pending' and r.created_at > now() - interval '45 minutes')
$$;

create or replace function private.reavers_app_event_today() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'America/Edmonton')::date $$;

-- What the public sign-up pages show: open sign-ups (or one event's, open or not), their tickets and spots left.
-- No names or emails. Anyone, signed in or not.
create or replace function public.reavers_app_event_public(p_event_id text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'event_id', s.event_id, 'title', s.title, 'event_date', s.event_date, 'start_time', s.start_time,
      'location', s.location, 'intro', s.intro, 'ask_phone', s.ask_phone, 'ask_club', s.ask_club,
      'closes_on', coalesce(s.closes_on, s.event_date),
      'open', s.open and coalesce(s.closes_on, s.event_date) >= private.reavers_app_event_today(),
      'spots_left', case when s.capacity is null then null else greatest(0, s.capacity - (
          select coalesce(sum(r.quantity), 0) from public.reavers_app_event_registrations r
           where r.signup_id = s.id and private.reavers_app_event_holds(r))) end,
      'tickets', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', t.id, 'title', t.title, 'kind', t.kind, 'description', t.description, 'price_cents', t.price_cents,
          'max_per_order', t.max_per_order,
          'spots_left', case when t.capacity is null then null else greatest(0, t.capacity - (
              select coalesce(sum(r.quantity), 0) from public.reavers_app_event_registrations r
               where r.ticket_id = t.id and private.reavers_app_event_holds(r))) end
        ) order by t.sort_order, t.price_cents desc, t.title), '[]'::jsonb)
        from public.reavers_app_event_tickets t where t.signup_id = s.id and t.active)
    ) order by s.event_date, s.title), '[]'::jsonb)
  from public.reavers_app_event_signups s
  where case when p_event_id is null
             then s.open and coalesce(s.closes_on, s.event_date) >= private.reavers_app_event_today()
             else s.event_id = p_event_id end
$$;
revoke all on function public.reavers_app_event_public(text) from public;
grant execute on function public.reavers_app_event_public(text) to anon, authenticated;

-- After paying, Square sends the buyer back to the sign-up page with the registration id; this says how it stands.
-- The id is a random UUID only the buyer has, and only the first name comes back.
create or replace function public.reavers_app_event_registration_status(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('status', r.status, 'ticket', r.ticket_title, 'quantity', r.quantity,
                            'first_name', split_part(trim(r.name), ' ', 1), 'event_id', s.event_id, 'title', s.title)
  from public.reavers_app_event_registrations r join public.reavers_app_event_signups s on s.id = r.signup_id
  where r.id = p_id
$$;
revoke all on function public.reavers_app_event_registration_status(uuid) from public;
grant execute on function public.reavers_app_event_registration_status(uuid) to anon, authenticated;

-- Holds a place for someone signing up. Called only by the reavers-event-signup function (service role), which then
-- sends paid tickets to Square. Locks the event so two people can't take the last spot at once.
create or replace function public.reavers_app_event_reserve(
  p_ticket uuid, p_quantity int, p_name text, p_email text, p_phone text default null, p_club text default null, p_note text default null
) returns public.reavers_app_event_registrations
language plpgsql security definer set search_path = '' as $$
declare
  t public.reavers_app_event_tickets;
  s public.reavers_app_event_signups;
  taken int;
  row public.reavers_app_event_registrations;
begin
  select * into t from public.reavers_app_event_tickets where id = p_ticket;
  if not found or not t.active then raise exception 'That ticket isn''t available any more.' using errcode = 'P0001'; end if;
  select * into s from public.reavers_app_event_signups where id = t.signup_id for update;
  if not s.open or coalesce(s.closes_on, s.event_date) < private.reavers_app_event_today() then
    raise exception 'Sign-ups for this event are closed.' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > t.max_per_order then
    raise exception 'Pick between 1 and %.', t.max_per_order using errcode = 'P0001';
  end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Enter your name.' using errcode = 'P0001'; end if;
  if s.capacity is not null then
    select coalesce(sum(r.quantity), 0) into taken from public.reavers_app_event_registrations r
     where r.signup_id = s.id and private.reavers_app_event_holds(r);
    if taken + p_quantity > s.capacity then
      raise exception '%', case when taken >= s.capacity then 'This event is full.' else format('Only %s left.', s.capacity - taken) end using errcode = 'P0001';
    end if;
  end if;
  if t.capacity is not null then
    select coalesce(sum(r.quantity), 0) into taken from public.reavers_app_event_registrations r
     where r.ticket_id = t.id and private.reavers_app_event_holds(r);
    if taken + p_quantity > t.capacity then
      raise exception '%', case when taken >= t.capacity then format('%s is sold out.', t.title) else format('Only %s left for %s.', t.capacity - taken, t.title) end using errcode = 'P0001';
    end if;
  end if;
  insert into public.reavers_app_event_registrations
    (signup_id, ticket_id, ticket_title, kind, quantity, amount_cents, name, email, phone, club, note, status, added_by)
  values (s.id, t.id, t.title, t.kind, p_quantity, t.price_cents * p_quantity, left(trim(p_name), 120), nullif(left(trim(p_email), 200), ''),
          nullif(left(trim(p_phone), 40), ''), nullif(left(trim(p_club), 120), ''), nullif(left(trim(p_note), 1000), ''),
          case when t.price_cents = 0 then 'free' else 'pending' end, null)
  returning * into row;
  return row;
end $$;
revoke all on function public.reavers_app_event_reserve(uuid, int, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.reavers_app_event_reserve(uuid, int, text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------- Square → registrations

-- When the Square webhook records (or refunds) a payment, the registration with that Square order follows it.
create or replace function private.reavers_app_event_follow_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.square_order_id is null then return new; end if;
  update public.reavers_app_event_registrations r set
      status = case when new.amount_cents > 0 and new.refunded_cents >= new.amount_cents then 'refunded' else 'paid' end,
      paid_via = 'square',
      square_payment_id = new.square_payment_id,
      paid_at = coalesce(r.paid_at, new.paid_at)
    where r.square_order_id = new.square_order_id and r.status in ('pending', 'cancelled', 'paid', 'refunded');
  return new;
end $$;

create trigger reavers_app_event_follow_payment
  after insert or update of refunded_cents, status on public.reavers_app_square_payments
  for each row execute function private.reavers_app_event_follow_payment();

commit;

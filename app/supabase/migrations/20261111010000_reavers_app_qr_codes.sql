-- Reavers app: QR codes the executive adds themselves (a Square pay page, an event signup, a sponsor's page, any link),
-- shown on the QR codes page next to the four the website build makes. The app draws the code from the link, so only
-- the label and the link are stored. Who can see and add them follows the QR codes page's access (apply after
-- 20261111000000_reavers_app_page_access.sql): the executive by default, or anyone an admin gives the page to.

begin;

create table public.reavers_app_qr_codes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  note text check (note is null or char_length(note) <= 200),
  -- web links only: never javascript:, data: or other schemes
  url text not null check (char_length(url) <= 2000 and url ~* '^https?://[^\s]+$'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reavers_app_qr_codes_created_by_idx on public.reavers_app_qr_codes (created_by);

alter table public.reavers_app_qr_codes enable row level security;
create policy "qr page reads qr codes" on public.reavers_app_qr_codes for select to authenticated
  using ((select private.reavers_app_can_view('qr')));
create policy "qr page writes qr codes" on public.reavers_app_qr_codes for all to authenticated
  using ((select private.reavers_app_can_edit('qr'))) with check ((select private.reavers_app_can_edit('qr')));
grant select, insert, update, delete on public.reavers_app_qr_codes to authenticated;

commit;

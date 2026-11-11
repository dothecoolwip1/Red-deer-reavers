-- Reavers app: QR codes the executive adds themselves (a Square pay page, an event signup, a sponsor's page, any link),
-- shown on the QR codes page next to the four the website build makes. The app draws the code from the link, so only
-- the label and the link are stored. The executive reads and writes; members never see this table.

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
create policy "exec reads qr codes" on public.reavers_app_qr_codes for select to authenticated
  using ((select private.reavers_app_is_exec()));
create policy "exec writes qr codes" on public.reavers_app_qr_codes for all to authenticated
  using ((select private.reavers_app_is_exec())) with check ((select private.reavers_app_is_exec()));
grant select, insert, update, delete on public.reavers_app_qr_codes to authenticated;

commit;

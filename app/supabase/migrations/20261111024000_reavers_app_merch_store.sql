-- Reavers app: the merch store on reddeerreavers.com (store.html).
-- The store sells the club's existing Square items (stickers, trading cards, anything else treasury adds) through the same
-- reavers-square-checkout function as the app's pay page, so its sales show in Square sales, the Ledger and Merch like any
-- other online payment. This only adds two columns to reavers_app_square_items:
--   * in_store: shown on the website store. Only items that are also For sale and On the open page show (the existing
--     "anyone reads public items" policy already lets visitors read exactly those, and the store asks for in_store too).
--   * image_url: the item's photo, uploaded by treasury to the public reavers-site-media bucket (store/ folder). Treasury can
--     already upload there (the site editor page is always theirs), so no new storage policy is needed.
-- Existing sticker and trading card items that are for sale to everyone start in the store. Nothing else changes.

begin;

alter table public.reavers_app_square_items
  add column if not exists in_store boolean not null default false,
  add column if not exists image_url text
    check (image_url is null or (char_length(image_url) <= 1000 and image_url ~* '^https://[^\s"''<>]+$'));

update public.reavers_app_square_items
   set in_store = true
 where kind in ('sticker', 'trading_card') and active and public;

commit;

-- Reavers site editor: visitors read only the columns the public site needs.
-- 20261109010000 granted anon select on the whole reavers_app_site_content table, which included updated_by (an account id).
-- Public data never contains account ids, so anon keeps page, key, kind, value and updated_at only; the public site
-- (reddeerreavers.com site-content.js) selects key and value filtered by page.

begin;

revoke select on public.reavers_app_site_content from anon;
grant select (page, key, kind, value, updated_at) on public.reavers_app_site_content to anon;

commit;

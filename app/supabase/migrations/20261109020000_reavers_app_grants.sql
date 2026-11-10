-- Reavers app: the privileges the two Reavers app migrations left out.
-- This project revokes execute on new functions from public and all table privileges from anon/authenticated by default
-- (BuhurtOS 20261001000100_foundation.sql), so:
--   * the private role helpers used inside RLS policies must be executable by authenticated. Without this, every signed-in
--     read of storage.objects fails with "permission denied for function reavers_app_is_exec", because the receipts policy is
--     evaluated alongside every other bucket's policies;
--   * signed-in users need table privileges on the reavers_app_* tables. Row level security still decides which rows.

begin;

grant execute on function
  private.reavers_app_team(),
  private.reavers_app_has_office(text[]),
  private.reavers_app_is_finance(),
  private.reavers_app_is_exec(),
  private.reavers_app_is_member()
to authenticated;

grant select, insert, update, delete on
  public.reavers_app_transactions,
  public.reavers_app_budgets,
  public.reavers_app_payment_links,
  public.reavers_app_reimbursements,
  public.reavers_app_sponsors,
  public.reavers_app_sponsor_deliverables,
  public.reavers_app_grants,
  public.reavers_app_compliance,
  public.reavers_app_gear,
  public.reavers_app_gear_log,
  public.reavers_app_waivers,
  public.reavers_app_incidents,
  public.reavers_app_site_content
to authenticated;

grant select on public.reavers_app_reimbursement_approvals, public.reavers_app_site_content_history to authenticated;

commit;

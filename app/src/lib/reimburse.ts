/** Claims over this amount need two different approvers (matches two-signature practice for larger cheques). */
export const TWO_APPROVER_LIMIT_CENTS = 25000;

export type ClaimStatus = "submitted" | "approved" | "paid" | "rejected";
type Claim = { submitted_by: string; amount_cents: number; status: ClaimStatus };

export function approvalState(amountCents: number, approvers: string[]) {
  const needed = amountCents > TWO_APPROVER_LIMIT_CENTS ? 2 : 1;
  const have = new Set(approvers).size;
  return { needed, have, approved: have >= needed };
}

export function canApprove(claim: Claim, userId: string, approvers: string[]): boolean {
  if (claim.status !== "submitted") return false;
  if (claim.submitted_by === userId) return false;
  return !approvers.includes(userId);
}

import { describe, expect, it } from "vitest";
import { approvalState, canApprove } from "./reimburse";

const req = { submitted_by: "u1", amount_cents: 30000, status: "submitted" as const };

describe("reimbursement approvals", () => {
  it("never lets someone approve their own claim", () => {
    expect(canApprove(req, "u1", [])).toBe(false);
  });
  it("lets each approver approve once", () => {
    expect(canApprove(req, "u2", [])).toBe(true);
    expect(canApprove(req, "u2", ["u2"])).toBe(false);
  });
  it("needs two different approvers above $250, one at or below", () => {
    expect(approvalState(30000, ["u2"])).toEqual({ needed: 2, have: 1, approved: false });
    expect(approvalState(30000, ["u2", "u3"])).toEqual({ needed: 2, have: 2, approved: true });
    expect(approvalState(25000, ["u2"])).toEqual({ needed: 1, have: 1, approved: true });
  });
  it("cannot approve a claim that is already paid or rejected", () => {
    expect(canApprove({ ...req, status: "paid" }, "u2", [])).toBe(false);
  });
});

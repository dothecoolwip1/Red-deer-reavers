import { describe, expect, it } from "vitest";
import { can, roleFrom } from "./roles";

describe("roles", () => {
  it("picks the strongest role", () => {
    expect(roleFrom({ finance: true, exec: true, member: true })).toBe("finance");
    expect(roleFrom({ finance: false, exec: true, member: true })).toBe("exec");
    expect(roleFrom({ finance: false, exec: false, member: true })).toBe("member");
    expect(roleFrom({ finance: false, exec: false, member: false })).toBe("none");
  });
  it("keeps money approvals with finance and records with exec", () => {
    expect(can("finance", "money.approve")).toBe(true);
    expect(can("exec", "money.approve")).toBe(false);
    expect(can("exec", "money.view")).toBe(true);
    expect(can("exec", "records.edit")).toBe(true);
    expect(can("member", "records.edit")).toBe(false);
    expect(can("member", "self.use")).toBe(true);
    expect(can("none", "self.use")).toBe(false);
  });
});

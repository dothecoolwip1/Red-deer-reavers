import { describe, expect, it } from "vitest";
import { deadlineStatus, nextDue } from "./compliance";

describe("nextDue", () => {
  it("rolls yearly, quarterly and monthly items forward", () => {
    expect(nextDue("2026-06-30", "yearly")).toBe("2027-06-30");
    expect(nextDue("2026-11-30", "quarterly")).toBe("2027-02-28");
    expect(nextDue("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(nextDue("2026-01-31", "once")).toBeNull();
  });
});

describe("deadlineStatus", () => {
  it("labels done, overdue, due within 30 days and later", () => {
    expect(deadlineStatus("2026-11-01", "2026-11-09", "2026-10-30")).toBe("done");
    expect(deadlineStatus("2026-11-01", "2026-11-09")).toBe("overdue");
    expect(deadlineStatus("2026-12-09", "2026-11-09")).toBe("soon");
    expect(deadlineStatus("2026-12-10", "2026-11-09")).toBe("later");
  });
});

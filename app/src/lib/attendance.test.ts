import { describe, expect, it } from "vitest";
import { addMonths, ago, isNoShow, recentRate, timerState } from "./attendance";

const person = (o: Partial<Parameters<typeof isNoShow>[0]> = {}) =>
  ({ status: "active" as const, started_on: "2025-01-10", last_seen: null, removal_deadline: null, ...o });

describe("attendance", () => {
  it("counts months like the database", () => {
    expect(addMonths("2026-11-10", -3)).toBe("2026-08-10");
    expect(addMonths("2026-05-31", -3)).toBe("2026-02-28");
  });

  it("flags active people not seen in over three months", () => {
    expect(isNoShow(person({ last_seen: "2026-08-10" }), "2026-11-10")).toBe(true);
    expect(isNoShow(person({ last_seen: "2026-08-11" }), "2026-11-10")).toBe(false);
    expect(isNoShow(person({ last_seen: null, started_on: "2026-10-01" }), "2026-11-10")).toBe(false);
    expect(isNoShow(person({ last_seen: null, started_on: "2026-01-01" }), "2026-11-10")).toBe(true);
  });

  it("does not flag people who are away or already on a timer", () => {
    expect(isNoShow(person({ status: "away", last_seen: "2025-01-01" }), "2026-11-10")).toBe(false);
    expect(isNoShow(person({ status: "removal", last_seen: "2025-01-01" }), "2026-11-10")).toBe(false);
  });

  it("runs the removal timer down to the deadline", () => {
    expect(timerState({ status: "removal", removal_deadline: "2026-11-20" }, "2026-11-10")).toEqual({ running: true, daysLeft: 10, expired: false });
    expect(timerState({ status: "removal", removal_deadline: "2026-11-10" }, "2026-11-10")).toEqual({ running: true, daysLeft: 0, expired: true });
    expect(timerState({ status: "active", removal_deadline: null }, "2026-11-10")).toEqual({ running: false });
  });

  it("rates attendance over gatherings held since they started", () => {
    const dates = ["2026-07-01", "2026-09-01", "2026-10-01", "2026-11-01", "2026-12-01"];
    expect(recentRate(2, dates, "2020-01-01", "2026-11-10")).toEqual({ attended: 2, held: 3, percent: 67 });
    expect(recentRate(1, dates, "2026-10-15", "2026-11-10")).toEqual({ attended: 1, held: 1, percent: 100 });
    expect(recentRate(0, [], null, "2026-11-10").percent).toBeNull();
  });

  it("says how long ago", () => {
    expect(ago(null, "2026-11-10")).toBe("never");
    expect(ago("2026-11-03", "2026-11-10")).toBe("7 days ago");
    expect(ago("2026-06-10", "2026-11-10")).toBe("5 months ago");
  });
});

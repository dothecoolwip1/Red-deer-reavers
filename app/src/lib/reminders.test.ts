import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, duesMessage, eventMessage, nextDuesDays, nextPractice, practiceMessage, redDeerInstant, redDeerToday, warningMessage } from "./reminders";

const links = { pay: "https://app.reddeerreavers.com/#/pay", training: "https://reddeerreavers.com/training.html", events: "https://reddeerreavers.com/events.html" };

describe("Red Deer time", () => {
  // Alberta's clock rules can change (the time zone database decides), so check the round trip rather than a fixed offset.
  const wall = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  it("turns a Red Deer wall-clock time into the right instant, winter and summer", () => {
    expect(wall(redDeerInstant("2026-01-11", "17:00"))).toBe("2026-01-11, 17:00");
    expect(redDeerInstant("2026-01-11", "17:00").toISOString()).toBe("2026-01-12T00:00:00.000Z"); // MST, UTC-7
    expect(wall(redDeerInstant("2026-07-05", "17:00"))).toBe("2026-07-05, 17:00");
    expect(wall(redDeerInstant("2026-12-06", "17:30"))).toBe("2026-12-06, 17:30");
  });
  it("knows the local date late in the evening", () => {
    expect(redDeerToday(new Date("2026-12-06T05:00:00Z"))).toBe("2026-12-05");
  });
});

describe("dues schedule", () => {
  it("is this month's day when it hasn't passed, otherwise next month's", () => {
    expect(nextDuesDays({ dues_day: 1, dues_followup_days: 7 }, "2026-11-01")).toEqual({ first: "2026-11-01", followup: "2026-11-08" });
    expect(nextDuesDays({ dues_day: 1, dues_followup_days: 7 }, "2026-11-05")).toEqual({ first: "2026-12-01", followup: "2026-11-08" });
    expect(nextDuesDays({ dues_day: 15, dues_followup_days: 0 }, "2026-12-20")).toEqual({ first: "2027-01-15", followup: null });
  });
  it("drops a follow-up that would fall past the end of the month", () => {
    expect(nextDuesDays({ dues_day: 25, dues_followup_days: 10 }, "2026-11-02").followup).toBeNull();
  });
});

describe("next practice", () => {
  const practices = [
    { weekday: 3, start_time: "17:30:00", active: true, label: "Wednesday" },
    { weekday: 0, start_time: "17:00:00", active: true, label: "Sunday" },
    { weekday: 5, start_time: "18:00:00", active: false, label: "Friday" }
  ];
  it("picks the soonest active practice that hasn't started", () => {
    // Saturday Dec 5 2026, noon in Red Deer
    const n = nextPractice(practices, new Date("2026-12-05T19:00:00Z"), 24)!;
    expect(n.practice.label).toBe("Sunday");
    expect(n.day).toBe("2026-12-06");
    expect(n.startsAt.getTime() - n.remindAt.getTime()).toBe(24 * 3600e3);
    expect(n.startsAt.getTime()).toBe(redDeerInstant("2026-12-06", "17:00").getTime());
  });
  it("moves to next week once this week's reminder has gone out", () => {
    const n = nextPractice(practices, new Date("2026-12-10T01:00:00Z"), 24)!; // Wed Dec 9, 6 PM
    expect(n.day).toBe("2026-12-13");
  });
});

describe("wording", () => {
  const dues = { kind: "dues" as const, ref: "r", key: "k", month: "2026-12-01", price_cents: 2500, name: "Sam *Star* Lee", discord_id: "1", email: "s@example.com" };
  it("dues: names the month and price, links to pay by email and the button on Discord", () => {
    const m = duesMessage(dues, links);
    expect(m.subject).toBe("Reavers dues for December");
    expect(m.text).toContain("December ($25)");
    expect(m.text).toContain(links.pay);
    expect(m.discord).not.toContain(links.pay);
    expect(m.discord).toContain("with the button below");
    expect(duesMessage({ ...dues, kind: "dues_followup" }, links).subject).toMatch(/^Second reminder/);
  });
  it("practice: Discord timestamps and plain text", () => {
    const m = practiceMessage({ ref: "r", day: "2026-12-06", label: "Sunday", start_time: "17:00:00", end_time: "20:00:00", venue: "Springbrook", fee: "$10" }, links);
    expect(m.discord).toContain(`<t:${redDeerInstant("2026-12-06", "17:00").getTime() / 1000}:F>`);
    expect(m.text).toContain("Sunday, December 6, 5:00 PM to 8:00 PM");
    expect(m.text).toContain("Springbrook · $10");
  });
  it("event: says how soon and escapes Discord formatting", () => {
    const m = eventMessage({ ref: "r", title: "Demo @everyone", event_type: "demo", day: "2026-12-07", start_time: null, end_time: null, location: null, details: null, href: null }, "2026-12-05", links);
    expect(m.subject).toBe("Coming up in 2 days: Demo @everyone");
    expect(m.discord).not.toContain("@everyone");
    expect(m.discord).toContain(links.events);
  });
  it("warning: gives the date they need to come out by", () => {
    const m = warningMessage({ ref: "r", person_id: "p", name: "Jordan", since: "2026-09-01", limit_on: "2026-12-01", discord_id: "1" }, links);
    expect(m.discord).toContain("Tuesday, December 1");
  });
  it("defaults keep everything new off", () => {
    expect([DEFAULT_SETTINGS.dues_enabled, DEFAULT_SETTINGS.practice_enabled, DEFAULT_SETTINGS.events_enabled, DEFAULT_SETTINGS.noshow_warn_enabled]).toEqual([false, false, false, false]);
    expect(DEFAULT_SETTINGS.noshow_enabled).toBe(true);
  });
});

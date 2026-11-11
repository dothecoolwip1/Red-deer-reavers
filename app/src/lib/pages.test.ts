import { describe, expect, it } from "vitest";
import { PAGES, choicesFor, levelFor, levelsFor, parseLevels } from "./pages";

describe("page access", () => {
  it("follows the role when nobody set anything", () => {
    expect(levelFor("exec", "ledger")).toBe(1);
    expect(levelFor("exec", "sponsors")).toBe(2);
    expect(levelFor("member", "sponsors")).toBe(0);
    expect(levelFor("finance", "dues")).toBe(2);
  });
  it("lets an admin give or take a page", () => {
    expect(levelFor("member", "sponsors", "edit")).toBe(2);
    expect(levelFor("member", "ledger", "view")).toBe(1);
    expect(levelFor("exec", "attendance", "none")).toBe(0);
  });
  it("never locks treasury out, and never opens pages to outsiders", () => {
    expect(levelFor("finance", "ledger", "none")).toBe(2);
    expect(levelFor("none", "ledger", "edit")).toBe(0);
  });
  it("reads the server's answer and falls back to the role for anything missing", () => {
    const l = parseLevels("exec", { ledger: 2, sponsors: 0, bogus: 2, gear: "x" });
    expect(l.ledger).toBe(2);
    expect(l.sponsors).toBe(0);
    expect(l.gear).toBe(2);
    expect(parseLevels("member", null)).toEqual(levelsFor("member"));
  });
  it("offers view-only just for the money pages", () => {
    expect(choicesFor(PAGES.find(p => p.id === "ledger")!)).toEqual(["none", "view", "edit"]);
    expect(choicesFor(PAGES.find(p => p.id === "sponsors")!)).toEqual(["none", "edit"]);
  });
});

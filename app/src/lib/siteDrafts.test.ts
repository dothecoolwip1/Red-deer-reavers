import { describe, expect, it } from "vitest";
import { draftKey, effectiveValue, publishPlan, withChange } from "./siteDrafts";

const unit = { page: "index.html", key: "txt:a", kind: "text" as const, original: "Train together." };
const published = [{ id: "r1", page: "index.html", key: "txt:b", kind: "text" as const, value: "Fight on", original: "Join us" }];

describe("site editor drafts", () => {
  it("records a change as a draft and shows it as the current value", () => {
    const drafts = withChange({}, published, { ...unit, value: "Train hard." });
    expect(drafts[draftKey("index.html", "txt:a")]?.value).toBe("Train hard.");
    expect(effectiveValue(drafts, published, unit)).toBe("Train hard.");
  });
  it("drops the draft when text is typed back to what is live", () => {
    const once = withChange({}, published, { ...unit, value: "Train hard." });
    expect(withChange(once, published, { ...unit, value: "Train together." })).toEqual({});
  });
  it("turns typing a published item back to its original into a revert", () => {
    const drafts = withChange({}, published, { page: "index.html", key: "txt:b", kind: "text", original: "Join us", value: "Join us" });
    expect(drafts[draftKey("index.html", "txt:b")]?.value).toBeNull();
    expect(effectiveValue(drafts, published, { page: "index.html", key: "txt:b", original: "Join us" })).toBe("Join us");
  });
  it("ignores empty text, which would blank a heading on the live site", () => {
    expect(withChange({}, published, { ...unit, value: "   " })).toEqual({});
  });
  it("plans inserts, updates and removals for Publish", () => {
    let drafts = withChange({}, published, { ...unit, value: "Train hard." });
    drafts = withChange(drafts, published, { page: "index.html", key: "txt:b", kind: "text", original: "Join us", value: "Fight harder" });
    expect(publishPlan(drafts, published)).toEqual({
      inserts: [{ page: "index.html", key: "txt:a", kind: "text", value: "Train hard.", original: "Train together." }],
      updates: [{ id: "r1", value: "Fight harder" }],
      removes: []
    });
    const revert = withChange({}, published, { page: "index.html", key: "txt:b", kind: "text", original: "Join us", value: "Join us" });
    expect(publishPlan(revert, published)).toEqual({ inserts: [], updates: [], removes: ["r1"] });
  });
});

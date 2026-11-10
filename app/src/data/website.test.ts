import { describe, expect, it } from "vitest";
import { demoWebsite, hiddenFighterId, isHideRecord, sameName } from "./website";

describe("website records", () => {
  it("recognises the hide-from-website markers the public site uses", () => {
    expect(isHideRecord({ discipline: "hide-buhurtos:ABC-123" })).toBe(true);
    expect(hiddenFighterId({ discipline: "hide-buhurtos: ABC-123 " })).toBe("abc-123");
    expect(isHideRecord({ discipline: "Melee" })).toBe(false);
    expect(isHideRecord({ discipline: null })).toBe(false);
  });

  it("matches member names the way the old admin page did", () => {
    expect(sameName("  Casey   Smith ", "casey smith")).toBe(true);
    expect(sameName("Casey", "Casey Smith")).toBe(false);
  });

  it("saves, reorders and deletes in sample mode", async () => {
    const site = demoWebsite();
    const before = await site.get();
    await site.act({ action: "roster_save", item: { name: "New person", active: true, sort_order: 1 } });
    let data = await site.get();
    expect(data.roster[0].name).toBe("New person");
    const ids = data.roster.map(p => p.id).reverse();
    await site.act({ action: "roster_reorder", ids });
    data = await site.get();
    expect(data.roster.map(p => p.id)).toEqual(ids);
    await site.act({ action: "roster_delete", id: ids[0] });
    expect((await site.get()).roster).toHaveLength(before.roster.length);
    const inquiry = before.communityInquiries[0];
    await site.act({ action: "community_inquiry_status", id: inquiry.id, status: "booked" });
    expect((await site.get()).communityInquiries[0].status).toBe("booked");
  });
});

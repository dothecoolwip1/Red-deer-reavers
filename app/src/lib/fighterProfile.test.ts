import { describe, expect, it } from "vitest";
import { blankProfile, cleanProfile, missing, sponsorList, webAddress } from "./fighterProfile";

const ID = "11111111-1111-4111-8111-111111111111";

describe("cleanProfile", () => {
  it("tidies spaces and turns empty fields into nothing", () => {
    const r = cleanProfile({ fighter_id: ID, nickname: "  The   Anvil ", weight_class: "", about: "Line one\r\n\r\n\r\nLine two  ", show_on_site: true });
    expect(r).toHaveProperty("profile");
    if (!("profile" in r)) return;
    expect(r.profile.nickname).toBe("The Anvil");
    expect(r.profile.weight_class).toBeNull();
    expect(r.profile.about).toBe("Line one\n\nLine two");
    expect(r.profile.show_on_site).toBe(true);
    expect(r.profile.open_to_sponsors).toBe(false);
  });
  it("adds https:// to links and refuses other schemes", () => {
    const ok = cleanProfile({ fighter_id: ID, video_url: "youtube.com/watch?v=abc", photo_url: "http://example.com/a.jpg" });
    expect("profile" in ok && ok.profile.video_url).toBe("https://youtube.com/watch?v=abc");
    expect("profile" in ok && ok.profile.photo_url).toBe("https://example.com/a.jpg");
    const bad = cleanProfile({ fighter_id: ID, photo_url: "javascript:alert(1)", video_url: "data:text/html,hi" });
    expect("errors" in bad && bad.errors).toHaveLength(2);
  });
  it("keeps site paths, and data: photos only in sample mode", () => {
    expect(cleanProfile({ fighter_id: ID, photo_url: "/assets/a.webp" })).toHaveProperty("profile");
    expect(cleanProfile({ fighter_id: ID, photo_url: "//evil.example/a.jpg" })).toHaveProperty("errors");
    expect(cleanProfile({ fighter_id: ID, photo_url: "data:image/png;base64,AAAA" })).toHaveProperty("errors");
    expect(cleanProfile({ fighter_id: ID, photo_url: "data:image/png;base64,AAAA" }, true)).toHaveProperty("profile");
  });
  it("enforces the database's length limits", () => {
    const r = cleanProfile({ fighter_id: ID, tagline: "x".repeat(141) });
    expect("errors" in r && r.errors[0]).toMatch(/Motto can be at most 140/);
  });
});

describe("helpers", () => {
  it("webAddress", () => {
    expect(webAddress("")).toBeNull();
    expect(webAddress("not a link")).toBeUndefined();
    expect(webAddress("https://instagram.com/p/x")).toBe("https://instagram.com/p/x");
  });
  it("missing lists what to fill in", () => {
    expect(missing(null)).toHaveLength(4);
    expect(missing({ ...blankProfile(ID), weight_class: "Heavyweight", team_role: "Polearm" })).toEqual(["action photo", "motto"]);
  });
  it("sponsorList splits on commas and semicolons", () => {
    expect(sponsorList("Iron Works, Gaetz Gym; Red Deer Tattoo")).toEqual(["Iron Works", "Gaetz Gym", "Red Deer Tattoo"]);
    expect(sponsorList(null)).toEqual([]);
  });
});

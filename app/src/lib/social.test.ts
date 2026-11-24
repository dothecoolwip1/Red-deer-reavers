import { describe, expect, it } from "vitest";
import { blueskyLinkFacets, problemsFor, rollup, textFor, textLength, xLength, youtubeTitle, type MediaItem, type PostDraft } from "./social";

const img = (o: Partial<MediaItem> = {}): MediaItem => ({ url: "https://x.test/a.jpg", path: "a.jpg", kind: "image", mime: "image/jpeg", size: 200_000, name: "a.jpg", ...o });
const vid = (o: Partial<MediaItem> = {}): MediaItem => ({ url: "https://x.test/v.mp4", path: "v.mp4", kind: "video", mime: "video/mp4", size: 20_000_000, name: "v.mp4", ...o });
const post = (o: Partial<PostDraft> = {}): PostDraft => ({ body: "Practice Sunday at 5!", media: [], ...o });

describe("text for each platform", () => {
  it("uses a platform's own wording when there is one, and adds the link once", () => {
    const p = post({ texts: { x: "Short one" }, link_url: "https://reddeerreavers.com/events.html" });
    expect(textFor(p, "x")).toBe("Short one\n\nhttps://reddeerreavers.com/events.html");
    expect(textFor(p, "facebook")).toBe("Practice Sunday at 5!\n\nhttps://reddeerreavers.com/events.html");
    expect(textFor(post({ body: "See https://a.test", link_url: "https://a.test" }), "bluesky")).toBe("See https://a.test");
  });
  it("counts emoji as one, and every link as 23 on X", () => {
    expect(textLength("⚔️🛡️ go")).toBe(5);
    expect(xLength("hi https://reddeerreavers.com/a/very/long/path/that/goes/on")).toBe(26);
  });
  it("gives YouTube a title from the first line", () => {
    expect(youtubeTitle(post({ body: "Rumble 2026 highlights\nMore below" }))).toBe("Rumble 2026 highlights");
    expect(youtubeTitle(post({ options: { youtube_title: "My <title>" } }))).toBe("My title");
  });
});

describe("what each platform accepts", () => {
  it("text alone is fine on Facebook, X, Bluesky and Discord but not Instagram, YouTube or TikTok", () => {
    for (const p of ["facebook", "x", "bluesky", "discord"] as const) expect(problemsFor(post(), p)).toEqual([]);
    expect(problemsFor(post(), "instagram")).toEqual(["Instagram needs a photo or a video."]);
    expect(problemsFor(post(), "youtube")).toEqual(["YouTube needs a video."]);
    expect(problemsFor(post(), "tiktok")).toEqual(["TikTok needs a video."]);
  });
  it("catches text that's too long", () => {
    expect(problemsFor(post({ body: "a".repeat(281) }), "x")[0]).toMatch(/Too long by 1/);
    expect(problemsFor(post({ body: "a".repeat(281), texts: { x: "short" } }), "x")).toEqual([]);
  });
  it("checks photos and videos", () => {
    expect(problemsFor(post({ media: [img(), img(), img(), img(), img()] }), "x")).toEqual(["X (Twitter) takes up to 4 photos."]);
    expect(problemsFor(post({ media: [img({ size: 2_000_000 })] }), "bluesky")[0]).toMatch(/over 1 MB/);
    expect(problemsFor(post({ media: [img({ mime: "image/png" })] }), "instagram")).toEqual(["Instagram takes JPEG photos only."]);
    expect(problemsFor(post({ media: [vid()] }), "x")).toEqual(["Videos can't post to X (Twitter) from here yet; use photos."]);
    expect(problemsFor(post({ media: [vid(), img()] }), "facebook")).toContain("Use photos or one video, not both.");
    expect(problemsFor(post({ media: [vid()] }), "youtube")).toEqual([]);
    expect(problemsFor(post({ media: [vid({ size: 70_000_000 })] }), "tiktok")).toEqual(["Videos for TikTok must be under 64 MB from here."]);
  });
});

describe("post status follows its accounts", () => {
  const t = (status: "pending" | "publishing" | "published" | "failed" | "skipped", attempts = 1) => ({ status, attempts });
  it("stays a draft or cancelled", () => {
    expect(rollup("draft", [t("published")])).toBe("draft");
    expect(rollup("cancelled", [t("pending", 0)])).toBe("cancelled");
  });
  it("is scheduled until something is tried, then publishing, then done", () => {
    expect(rollup("scheduled", [t("pending", 0), t("pending", 0)])).toBe("scheduled");
    expect(rollup("scheduled", [t("published"), t("pending", 0)])).toBe("publishing");
    expect(rollup("publishing", [t("published"), t("failed", 1)])).toBe("publishing"); // will be retried
    expect(rollup("publishing", [t("published"), t("failed", 3)])).toBe("partial");
    expect(rollup("publishing", [t("published"), t("skipped")])).toBe("published");
    expect(rollup("publishing", [t("failed", 3)])).toBe("failed");
  });
});

describe("Bluesky link facets", () => {
  it("counts in UTF-8 bytes and leaves off trailing punctuation", () => {
    const f = blueskyLinkFacets("Épée night → https://reddeerreavers.com/events.html.");
    expect(f).toHaveLength(1);
    const enc = new TextEncoder();
    const bytes = enc.encode("Épée night → https://reddeerreavers.com/events.html.");
    expect(new TextDecoder().decode(bytes.slice(f[0].index.byteStart, f[0].index.byteEnd))).toBe("https://reddeerreavers.com/events.html");
    expect(f[0].features[0].uri).toBe("https://reddeerreavers.com/events.html");
  });
});

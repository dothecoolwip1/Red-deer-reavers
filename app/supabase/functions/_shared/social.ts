// Social media manager logic shared by the reavers-social function and the app (tested from app/src/lib/social.test.ts).
// What each platform takes, checking a post before it's scheduled, and how a post's status follows its accounts.
// No Deno- or Node-only APIs here: plain data only.

export type Platform = "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "bluesky" | "discord";

export type PlatformInfo = {
  id: Platform; label: string;
  /** Longest text the platform takes. */
  maxText: number;
  /** "none": text alone is fine; "media": needs a photo or video; "video": needs a video. */
  needs: "none" | "media" | "video";
  maxImages: number;
  /** Takes a video (only one per post on every platform here). */
  video: boolean;
  /** Largest single image the platform takes, in bytes (null: no limit worth checking here). */
  maxImageBytes: number | null;
  /** How an admin connects it: through the platform's sign-in page, or by pasting a key into a form. */
  connect: "oauth" | "form";
  /** One line on what has to happen at the platform before posts go out to the public. Empty: nothing. */
  approval: string;
};

export const PLATFORMS: PlatformInfo[] = [
  { id: "facebook", label: "Facebook Page", maxText: 63206, needs: "none", maxImages: 10, video: true, maxImageBytes: 10_000_000, connect: "oauth",
    approval: "Meta app review for pages_manage_posts before anyone but the app's own admins and testers can connect." },
  { id: "instagram", label: "Instagram", maxText: 2200, needs: "media", maxImages: 10, video: true, maxImageBytes: 8_000_000, connect: "oauth",
    approval: "Meta app review for instagram_business_content_publish. Until then only accounts added as testers in the Meta app can post." },
  { id: "youtube", label: "YouTube", maxText: 5000, needs: "video", maxImages: 0, video: true, maxImageBytes: null, connect: "oauth",
    approval: "Google's YouTube API audit. Until it passes, every upload is locked to private, whatever you pick." },
  { id: "tiktok", label: "TikTok", maxText: 2200, needs: "video", maxImages: 0, video: true, maxImageBytes: null, connect: "oauth",
    approval: "TikTok's Content Posting API audit. Until it passes, posts can only be private (Only me)." },
  { id: "x", label: "X (Twitter)", maxText: 280, needs: "none", maxImages: 4, video: false, maxImageBytes: 5_000_000, connect: "oauth",
    approval: "X charges per post (pay-per-use credits in the X developer console)." },
  { id: "bluesky", label: "Bluesky", maxText: 300, needs: "none", maxImages: 4, video: false, maxImageBytes: 1_000_000, connect: "form",
    approval: "" },
  { id: "discord", label: "Discord channel", maxText: 2000, needs: "none", maxImages: 10, video: true, maxImageBytes: null, connect: "form",
    approval: "" }
];
export const PLATFORM: Record<Platform, PlatformInfo> = Object.fromEntries(PLATFORMS.map(p => [p.id, p])) as Record<Platform, PlatformInfo>;
export const isPlatform = (v: unknown): v is Platform => typeof v === "string" && v in PLATFORM;

export type MediaItem = {
  /** Public address (reavers-social-media bucket). The platforms fetch it from there. */
  url: string; path: string; kind: "image" | "video"; mime: string; size: number; name: string; alt?: string | null;
};
export type YoutubePrivacy = "public" | "unlisted" | "private";
export type TiktokPrivacy = "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
export type PostOptions = { youtube_title?: string; youtube_privacy?: YoutubePrivacy; tiktok_privacy?: TiktokPrivacy };
export type PostDraft = {
  body: string;
  /** Different wording for one platform (say a shorter one for X). Empty or missing uses body. */
  texts?: Partial<Record<Platform, string>>;
  media: MediaItem[];
  link_url?: string | null;
  options?: PostOptions;
};

/** Counts characters the way people see them (an emoji is one), which is how Bluesky and X count. */
export function textLength(s: string): number {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<unknown> } }).Segmenter;
  if (Seg) { let n = 0; for (const _ of new Seg(undefined, { granularity: "grapheme" }).segment(s)) n++; return n; }
  return [...s].length;
}

/** X counts every link as 23 characters, however long it is. */
const URL_RE = /https?:\/\/[^\s<>"]+/g;
export function xLength(s: string): number {
  return textLength(s.replace(URL_RE, "x".repeat(23)));
}

/** The text one platform gets: its own wording if there is one, else the shared text, with the link on the end if it isn't in it. */
export function textFor(post: PostDraft, p: Platform): string {
  const own = post.texts?.[p]?.trim();
  let t = (own || post.body || "").trim();
  const link = (post.link_url || "").trim();
  // YouTube and TikTok put the link in the description too; Instagram captions don't make links clickable, but it still reads fine.
  if (link && !t.includes(link)) t = t ? `${t}\n\n${link}` : link;
  return t;
}

export const lengthFor = (text: string, p: Platform) => (p === "x" ? xLength(text) : textLength(text));

/** YouTube needs a title: the one given, else the first line of the text, at most 100 characters. */
export function youtubeTitle(post: PostDraft): string {
  const t = (post.options?.youtube_title || "").trim() || (post.texts?.youtube || post.body || "").trim().split("\n")[0] || "Red Deer Reavers";
  return [...t.replace(/[<>]/g, "")].slice(0, 100).join("");
}

/** What's wrong with this post for one platform, in words for the admin. Empty: it can go. */
export function problemsFor(post: PostDraft, p: Platform): string[] {
  const info = PLATFORM[p];
  const out: string[] = [];
  const text = textFor(post, p);
  const images = post.media.filter(m => m.kind === "image");
  const videos = post.media.filter(m => m.kind === "video");
  const len = lengthFor(text, p);
  if (!text && !post.media.length) out.push("Write something or add a photo.");
  if (len > info.maxText) out.push(`Too long by ${len - info.maxText} (${info.label} takes ${info.maxText}).`);
  if (info.needs === "media" && !post.media.length) out.push(`${info.label} needs a photo or a video.`);
  if (info.needs === "video" && !videos.length) out.push(`${info.label} needs a video.`);
  if (videos.length > 1) out.push("Only one video per post.");
  if (videos.length && images.length) out.push("Use photos or one video, not both.");
  if (videos.length && !info.video) out.push(`Videos can't post to ${info.label} from here yet; use photos.`);
  if (info.needs === "video" && images.length) out.push(`${info.label} takes a video only, not photos.`);
  if (images.length > info.maxImages && info.needs !== "video") out.push(`${info.label} takes up to ${info.maxImages} photos.`);
  if (info.maxImageBytes) {
    const big = images.filter(m => m.size > info.maxImageBytes!);
    if (big.length) out.push(`${big.length === 1 ? "A photo is" : `${big.length} photos are`} over ${Math.round(info.maxImageBytes / 1e6)} MB, the most ${info.label} takes.`);
  }
  if (p === "instagram" && images.some(m => !/jpe?g$/i.test(m.mime))) out.push("Instagram takes JPEG photos only.");
  if (p === "tiktok" && videos.some(v => v.size > 64_000_000)) out.push("Videos for TikTok must be under 64 MB from here.");
  return out;
}

export type TargetStatus = "pending" | "publishing" | "published" | "failed" | "skipped";
export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed" | "cancelled";
/** A failed account is tried this many times in all, a few minutes apart, before it's left failed. */
export const MAX_ATTEMPTS = 3;

/** How a post stands from its accounts (the same rule as the database trigger in migration 20261124000000). */
export function rollup(current: PostStatus, targets: { status: TargetStatus; attempts: number }[]): PostStatus {
  if (current === "draft" || current === "cancelled" || !targets.length) return current;
  const open = targets.filter(t => t.status === "pending" || t.status === "publishing" || (t.status === "failed" && t.attempts < MAX_ATTEMPTS));
  if (open.length) return targets.some(t => t.attempts > 0) ? "publishing" : "scheduled";
  const ok = targets.filter(t => t.status === "published").length;
  const bad = targets.filter(t => t.status === "failed").length;
  if (!ok) return bad ? "failed" : "published";
  return bad ? "partial" : "published";
}

/** Minutes to wait before trying a failed account again: 5, then 20. */
export const retryDelayMinutes = (attempts: number) => (attempts <= 1 ? 5 : 20);

/** Bluesky makes links clickable only with "facets": where each link sits, counted in UTF-8 bytes. */
export function blueskyLinkFacets(text: string): { index: { byteStart: number; byteEnd: number }; features: { $type: string; uri: string }[] }[] {
  const enc = new TextEncoder();
  const out: ReturnType<typeof blueskyLinkFacets> = [];
  for (const m of text.matchAll(URL_RE)) {
    const uri = m[0].replace(/[.,;:!?)]+$/, "");
    const byteStart = enc.encode(text.slice(0, m.index)).length;
    out.push({ index: { byteStart, byteEnd: byteStart + enc.encode(uri).length }, features: [{ $type: "app.bsky.richtext.facet#link", uri }] });
  }
  return out;
}

export type PostStats = { likes?: number; comments?: number; shares?: number; views?: number };
export const statsLine = (s: PostStats | null | undefined): string => {
  if (!s) return "";
  const bits: string[] = [];
  if (s.views != null) bits.push(`${s.views} view${s.views === 1 ? "" : "s"}`);
  if (s.likes != null) bits.push(`${s.likes} like${s.likes === 1 ? "" : "s"}`);
  if (s.comments != null) bits.push(`${s.comments} comment${s.comments === 1 ? "" : "s"}`);
  if (s.shares != null) bits.push(`${s.shares} share${s.shares === 1 ? "" : "s"}`);
  return bits.join(" · ");
};

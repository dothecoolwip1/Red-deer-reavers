import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaItem, Platform, PostDraft, PostOptions, PostStats, PostStatus, TargetStatus } from "../lib/social";

// The social media manager (Growth → Social media). Accounts, posts and where each post goes live in reavers_app_social_*
// (migration 20261124000000). Connecting accounts and posting go through the reavers-social function, which keeps the keys.

export const SOCIAL_BUCKET = "reavers-social-media";

export type SocialAccount = {
  id: string; platform: Platform; external_id: string; name: string; handle: string | null; avatar_url: string | null; profile_url: string | null;
  status: "connected" | "needs_reconnect"; last_error: string | null; connected_at: string; token_expires_at: string | null;
};
export type SocialPost = {
  id: string; body: string; texts: Partial<Record<Platform, string>>; media: MediaItem[]; link_url: string | null; options: PostOptions;
  status: PostStatus; scheduled_at: string | null; published_at: string | null; created_by_name: string | null; created_at: string; updated_at: string;
};
export type SocialTarget = {
  id: string; post_id: string; account_id: string | null; platform: Platform; account_name: string; status: TargetStatus; attempts: number;
  next_try_at: string | null; external_id: string | null; url: string | null; error: string | null; note: string | null;
  published_at: string | null; stats: PostStats | null; stats_at: string | null;
};
/** Which platforms have their developer app keys on the server. null: the function isn't deployed yet. */
export type SocialStatus = { platforms: Record<Platform, boolean>; redirectUri: string; schedule: boolean } | null;
/** when: "draft", "now", or the instant to post at. */
export type SaveRequest = { id?: string; draft: PostDraft; accountIds: string[]; when: "draft" | "now" | Date; byName: string };

export interface SocialApi {
  /** null until the update is applied to the database. */
  accounts(): Promise<SocialAccount[] | null>;
  posts(): Promise<{ posts: SocialPost[]; targets: SocialTarget[] }>;
  status(): Promise<SocialStatus>;
  /** The platform's sign-in page to send the person to, or null when it connected right away (sample mode). */
  connect(platform: Platform, returnTo: string): Promise<string | null>;
  /** Bluesky (handle + app password) or Discord (webhook address). Returns what was connected. */
  connectForm(platform: Platform, fields: Record<string, string>): Promise<string>;
  disconnect(id: string): Promise<void>;
  upload(file: File): Promise<MediaItem>;
  /** Saves the post and the accounts it goes to. Returns what happened, in words. */
  save(req: SaveRequest): Promise<string>;
  cancel(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  retry(targetId: string): Promise<string>;
  runNow(): Promise<string>;
}

const MISSING = new Set(["PGRST202", "PGRST205", "42P01", "42883"]);
const fail = (error: { message: string; code?: string } | null) => {
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
};

async function invoke(sb: SupabaseClient, body: Record<string, unknown>) {
  const { data, error } = await sb.functions.invoke("reavers-social", { body });
  if (!error) return data as Record<string, unknown>;
  let message = error.message;
  try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) message = b.error; } catch { /* keep the generic message */ }
  if (/Failed to send|NetworkError|Load failed|404|FunctionsFetchError/i.test(message)) message = "The social media function isn't set up on the server yet (docs/social-media.md).";
  throw new Error(message);
}

const ranSummary = (r: Record<string, unknown>) => {
  const p = Number(r.published || 0), f = Number(r.failed || 0);
  if (!p && !f) return "Nothing was due.";
  return [p && `Posted to ${p} account${p === 1 ? "" : "s"}`, f && `${f} failed (see below)`].filter(Boolean).join(", ") + ".";
};

const scheduleFor = (when: SaveRequest["when"]) =>
  when === "draft" ? { status: "draft" as const, scheduled_at: null } : { status: "scheduled" as const, scheduled_at: (when === "now" ? new Date() : when).toISOString() };

export function liveSocial(sb: () => SupabaseClient, userId: () => string): SocialApi {
  return {
    async accounts() {
      const { data, error } = await sb().from("reavers_app_social_accounts").select("*").order("platform").order("name");
      if (error && MISSING.has(error.code || "")) return null;
      fail(error);
      return (data || []) as SocialAccount[];
    },
    async posts() {
      const [p, t] = await Promise.all([
        sb().from("reavers_app_social_posts").select("*").order("scheduled_at", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false }).limit(300),
        sb().from("reavers_app_social_targets").select("*").limit(3000)
      ]);
      if (p.error && MISSING.has(p.error.code || "")) return { posts: [], targets: [] };
      fail(p.error); fail(t.error);
      return { posts: (p.data || []) as SocialPost[], targets: (t.data || []) as SocialTarget[] };
    },
    async status() {
      try { return (await invoke(sb(), { action: "status" })) as SocialStatus; } catch { return null; }
    },
    async connect(platform, returnTo) {
      const r = await invoke(sb(), { action: "connect", platform, return_to: returnTo });
      return String(r.url);
    },
    async connectForm(platform, fields) {
      const r = await invoke(sb(), { action: "connect_form", platform, fields });
      return `Connected ${(r.connected as string[]).join(", ")}.`;
    },
    async disconnect(id) {
      const { error } = await sb().from("reavers_app_social_accounts").delete().eq("id", id);
      fail(error);
    },
    async upload(file) {
      const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80) || "file";
      const path = `${new Date().getFullYear()}/${userId()}/${Date.now()}-${safe}`;
      const { error } = await sb().storage.from(SOCIAL_BUCKET).upload(path, file, { contentType: file.type });
      fail(error);
      return {
        url: sb().storage.from(SOCIAL_BUCKET).getPublicUrl(path).data.publicUrl, path,
        kind: file.type.startsWith("video/") ? "video" : "image", mime: file.type, size: file.size, name: file.name
      };
    },
    async save({ id, draft, accountIds, when, byName }) {
      const row = { body: draft.body, texts: draft.texts || {}, media: draft.media, link_url: draft.link_url || null, options: draft.options || {}, ...scheduleFor(when) };
      let postId = id;
      if (postId) {
        const { error } = await sb().from("reavers_app_social_posts").update(row).eq("id", postId);
        fail(error);
      } else {
        const { data, error } = await sb().from("reavers_app_social_posts").insert({ ...row, created_by_name: byName }).select("id").single();
        fail(error);
        postId = data!.id as string;
      }
      const { data: have, error: e1 } = await sb().from("reavers_app_social_targets").select("id, account_id").eq("post_id", postId);
      fail(e1);
      const drop = (have || []).filter(t => !accountIds.includes(t.account_id)).map(t => t.id);
      if (drop.length) { const { error } = await sb().from("reavers_app_social_targets").delete().in("id", drop); fail(error); }
      const { data: accounts } = await sb().from("reavers_app_social_accounts").select("id, platform, name").in("id", accountIds);
      const add = (accounts || []).filter(a => !(have || []).some(t => t.account_id === a.id))
        .map(a => ({ post_id: postId, account_id: a.id, platform: a.platform, account_name: a.name }));
      if (add.length) { const { error } = await sb().from("reavers_app_social_targets").insert(add); fail(error); }
      if (when === "draft") return "Draft saved.";
      if (when !== "now") return "Scheduled.";
      try { return ranSummary(await invoke(sb(), { action: "run" })); }
      catch (e) { return `Saved, but it couldn't be posted yet: ${(e as Error).message}`; }
    },
    async cancel(id) {
      const { error } = await sb().from("reavers_app_social_posts").update({ status: "cancelled" }).eq("id", id);
      fail(error);
    },
    async remove(id) {
      const { error } = await sb().from("reavers_app_social_posts").delete().eq("id", id);
      fail(error);
    },
    async retry(targetId) { return ranSummary(await invoke(sb(), { action: "retry", target_id: targetId })); },
    async runNow() { return ranSummary(await invoke(sb(), { action: "run" })); }
  };
}

// ------------------------------------------------------------------ sample data (demo mode)

const KEY = "reavers-app-social-demo-v1";
export const DEMO_SOCIAL_KEY = KEY;
const hours = (h: number) => new Date(Date.now() + h * 3600e3).toISOString();
const SAMPLE_IMG = "https://reddeerreavers.com/assets/involved.jpg";

type DemoDb = { accounts: SocialAccount[]; posts: SocialPost[]; targets: SocialTarget[] };
function demoSeed(): DemoDb {
  const acct = (id: string, platform: Platform, name: string, handle: string | null, extra: Partial<SocialAccount> = {}): SocialAccount => ({
    id, platform, external_id: id, name, handle, avatar_url: null, profile_url: null, status: "connected", last_error: null,
    connected_at: hours(-24 * 20), token_expires_at: null, ...extra
  });
  const accounts = [
    acct("demo-fb", "facebook", "Red Deer Reavers", null),
    acct("demo-ig", "instagram", "Red Deer Reavers", "red_deer_reavers", { token_expires_at: hours(24 * 40) }),
    acct("demo-yt", "youtube", "Red Deer Reavers", "@reddeerreavers"),
    acct("demo-dc", "discord", "Reavers announcements", null)
  ];
  const post = (id: string, o: Partial<SocialPost>): SocialPost => ({
    id, body: "", texts: {}, media: [], link_url: null, options: {}, status: "draft", scheduled_at: null, published_at: null,
    created_by_name: "Sample admin", created_at: hours(-48), updated_at: hours(-48), ...o
  });
  const tgt = (post_id: string, a: SocialAccount, o: Partial<SocialTarget> = {}): SocialTarget => ({
    id: `${post_id}-${a.id}`, post_id, account_id: a.id, platform: a.platform, account_name: a.name, status: "pending", attempts: 0,
    next_try_at: null, external_id: null, url: null, error: null, note: null, published_at: null, stats: null, stats_at: null, ...o
  });
  const photo: MediaItem = { url: SAMPLE_IMG, path: "sample.jpg", kind: "image", mime: "image/jpeg", size: 420_000, name: "practice.jpg" };
  const [fb, ig, yt, dc] = accounts;
  return {
    accounts,
    posts: [
      post("demo-p1", { body: "Red Deer Rumble 2027 fighter registration is open! Early-bird pricing until January 31.", link_url: "https://reddeerreavers.com/events.html", media: [photo], status: "scheduled", scheduled_at: hours(26) }),
      post("demo-p2", { body: "Practice moves to the Westerner Park arena this Sunday, 5 PM. Loaner armour available, bring a water bottle.", status: "scheduled", scheduled_at: hours(72) }),
      post("demo-p3", { body: "What a weekend at the Rumble ⚔️ Thank you to every fighter, marshal and volunteer.", media: [photo], status: "partial", scheduled_at: hours(-50), published_at: hours(-50) }),
      post("demo-p4", { body: "Highlights from Sunday's sparring night", status: "draft" })
    ],
    targets: [
      tgt("demo-p1", fb), tgt("demo-p1", ig), tgt("demo-p1", dc),
      tgt("demo-p2", fb), tgt("demo-p2", dc),
      tgt("demo-p3", fb, { status: "published", attempts: 1, url: "https://www.facebook.com/", published_at: hours(-50), stats: { likes: 84, comments: 12, shares: 9 } }),
      tgt("demo-p3", ig, { status: "published", attempts: 1, url: "https://www.instagram.com/", published_at: hours(-50), stats: { likes: 213, comments: 18 } }),
      tgt("demo-p3", yt, { status: "failed", attempts: 3, error: "YouTube needs a video." }),
      tgt("demo-p3", dc, { status: "published", attempts: 1, url: "https://discord.com/", published_at: hours(-50) })
    ]
  };
}

export function demoSocial(): SocialApi {
  let db: DemoDb;
  try { db = JSON.parse(localStorage.getItem(KEY) || "null") || demoSeed(); } catch { db = demoSeed(); }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  const NOTE = "Sample mode: nothing was posted.";
  return {
    async accounts() { return structuredClone(db.accounts); },
    async posts() { return structuredClone({ posts: db.posts, targets: db.targets }); },
    async status() {
      return { platforms: { facebook: true, instagram: true, youtube: true, tiktok: false, x: false, bluesky: true, discord: true }, redirectUri: "https://api-home.buhurtoshome.app/functions/v1/reavers-social", schedule: true };
    },
    async connect(platform) {
      const id = `demo-${platform}-${Date.now()}`;
      db.accounts.push({ id, platform, external_id: id, name: "Red Deer Reavers (sample)", handle: null, avatar_url: null, profile_url: null, status: "connected", last_error: null, connected_at: new Date().toISOString(), token_expires_at: null });
      keep();
      return null;
    },
    async connectForm(platform, fields) {
      const id = `demo-${platform}-${Date.now()}`;
      const name = platform === "bluesky" ? (fields.handle || "reavers.bsky.social").replace(/^@/, "") : "Reavers channel (sample)";
      db.accounts.push({ id, platform, external_id: id, name, handle: platform === "bluesky" ? name : null, avatar_url: null, profile_url: null, status: "connected", last_error: null, connected_at: new Date().toISOString(), token_expires_at: null });
      keep();
      return `Connected ${name}.`;
    },
    async disconnect(id) {
      db.accounts = db.accounts.filter(a => a.id !== id);
      db.targets = db.targets.map(t => (t.account_id === id ? { ...t, account_id: null } : t));
      keep();
    },
    async upload(file) {
      // Sample mode keeps the file in this browser only.
      const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
      return { url: file.size < 2_000_000 ? url : SAMPLE_IMG, path: file.name, kind: file.type.startsWith("video/") ? "video" : "image", mime: file.type, size: file.size, name: file.name };
    },
    async save({ id, draft, accountIds, when, byName }) {
      const sched = scheduleFor(when);
      const postId = id || `demo-p-${Date.now()}`;
      const base: SocialPost = db.posts.find(p => p.id === postId) || {
        id: postId, body: "", texts: {}, media: [], link_url: null, options: {}, status: "draft", scheduled_at: null, published_at: null,
        created_by_name: byName, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      const next: SocialPost = { ...base, body: draft.body, texts: draft.texts || {}, media: draft.media, link_url: draft.link_url || null, options: draft.options || {}, ...sched, updated_at: new Date().toISOString() };
      db.posts = [next, ...db.posts.filter(p => p.id !== postId)];
      db.targets = db.targets.filter(t => t.post_id !== postId || accountIds.includes(t.account_id || ""));
      for (const a of db.accounts.filter(x => accountIds.includes(x.id) && !db.targets.some(t => t.post_id === postId && t.account_id === x.id))) {
        db.targets.push({ id: `${postId}-${a.id}`, post_id: postId, account_id: a.id, platform: a.platform, account_name: a.name, status: "pending", attempts: 0, next_try_at: null, external_id: null, url: null, error: null, note: null, published_at: null, stats: null, stats_at: null });
      }
      if (when === "now") {
        const now = new Date().toISOString();
        db.targets = db.targets.map(t => (t.post_id === postId ? { ...t, status: "published", attempts: 1, published_at: now, url: "#" } : t));
        next.status = "published"; next.published_at = now;
      }
      keep();
      return when === "draft" ? "Draft saved." : when === "now" ? NOTE : `Scheduled. ${NOTE}`;
    },
    async cancel(id) { db.posts = db.posts.map(p => (p.id === id ? { ...p, status: "cancelled" } : p)); keep(); },
    async remove(id) { db.posts = db.posts.filter(p => p.id !== id); db.targets = db.targets.filter(t => t.post_id !== id); keep(); },
    async retry() { return NOTE; },
    async runNow() { return NOTE; }
  };
}

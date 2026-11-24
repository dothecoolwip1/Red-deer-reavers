// Talking to each social platform through its official API: sign-in links, swapping a sign-in code for keys, keeping
// keys fresh, posting, and reading likes and views. Used by the reavers-social function; tested from
// app/src/lib/socialPlatforms.test.ts with a stand-in fetch, so no Deno- or Node-only APIs here.
//
// Official docs each part follows:
//   Facebook Pages   developers.facebook.com/docs/pages-api/posts
//   Instagram        developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing
//   YouTube          developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
//   TikTok           developers.tiktok.com/doc/content-posting-api-reference-direct-post
//   X                docs.x.com/x-api/posts/manage-tweets, docs.x.com/x-api/media/upload-media
//   Bluesky          docs.bsky.app/docs/advanced-guides/posts
//   Discord          discord.com/developers/docs/resources/webhook#execute-webhook

import { blueskyLinkFacets, textFor, youtubeTitle, type Platform, type PostDraft, type PostStats, type TiktokPrivacy } from "./social.ts";

export type Config = {
  /** The one address every platform sends people back to after they sign in: this function's own URL. */
  redirectUri: string;
  graphVersion: string;
  metaAppId: string; metaAppSecret: string;
  instagramAppId: string; instagramAppSecret: string;
  googleClientId: string; googleClientSecret: string;
  tiktokClientKey: string; tiktokClientSecret: string;
  xClientId: string; xClientSecret: string;
};

export type Token = { access_token: string; refresh_token?: string | null; expires_at?: string | null; extra?: Record<string, unknown> };
export type ConnectedAccount = {
  platform: Platform; external_id: string; name: string; handle?: string | null; avatar_url?: string | null; profile_url?: string | null;
  token: Token;
  /** When the person has to sign in again (null: never, or the keys refresh on their own). */
  token_expires_at?: string | null;
};
export type AccountRef = { external_id: string; name: string; handle?: string | null; profile_url?: string | null };
export type Published = { external_id: string; url: string | null; note?: string | null };

export type Ctx = { fetch: typeof fetch; wait: (ms: number) => Promise<void>; now: () => number };

/** A platform said no. reconnect: the keys are no good any more, someone has to connect the account again. retry: worth trying later. */
export class PlatformError extends Error {
  constructor(message: string, public reconnect = false, public retry = true) { super(message); }
}

// ------------------------------------------------------------------ what's set up

/** Which platforms have their developer app keys on the server. Bluesky and Discord need none. */
export function configured(c: Config): Record<Platform, boolean> {
  return {
    facebook: Boolean(c.metaAppId && c.metaAppSecret),
    instagram: Boolean(c.instagramAppId && c.instagramAppSecret),
    youtube: Boolean(c.googleClientId && c.googleClientSecret),
    tiktok: Boolean(c.tiktokClientKey && c.tiktokClientSecret),
    x: Boolean(c.xClientId && c.xClientSecret),
    bluesky: true,
    discord: true
  };
}

const KEY_NAMES: Record<Platform, string> = {
  facebook: "META_APP_ID and META_APP_SECRET", instagram: "INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET",
  youtube: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET", tiktok: "TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET",
  x: "X_CLIENT_ID and X_CLIENT_SECRET", bluesky: "", discord: ""
};
export const missingKeys = (p: Platform) => KEY_NAMES[p];

// ------------------------------------------------------------------ helpers

const graph = (c: Config) => `https://graph.facebook.com/${c.graphVersion}`;
const graphVideo = (c: Config) => `https://graph-video.facebook.com/${c.graphVersion}`;
const igGraph = (c: Config) => `https://graph.instagram.com/${c.graphVersion}`;
const TIKTOK = "https://open.tiktokapis.com/v2";
const XAPI = "https://api.x.com/2";
const BSKY_PUBLIC = "https://public.api.bsky.app/xrpc";
const qs = (o: Record<string, string | number | boolean | null | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString();
const form = (o: Record<string, string | number | boolean | null | undefined>) => ({
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: qs(o)
});
const jsonPost = (body: unknown, token?: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json; charset=UTF-8", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body)
});
const inSeconds = (ctx: Ctx, s: unknown) => (typeof s === "number" && s > 0 ? new Date(ctx.now() + s * 1000).toISOString() : null);

/** Calls a platform and returns its JSON, or throws PlatformError with the platform's own words. */
async function call<T = Record<string, unknown>>(ctx: Ctx, label: string, url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try { res = await ctx.fetch(url, init); } catch (e) { throw new PlatformError(`Couldn't reach ${label} (${(e as Error).message})`); }
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 300) }; }
  const err = body.error as Record<string, unknown> | string | undefined;
  // TikTok answers { error: { code: "ok" } } on success.
  const tiktokOk = typeof err === "object" && err?.code === "ok";
  if (res.ok && (!err || tiktokOk)) return body as T;
  const said = typeof err === "string" ? (body.error_description as string) || err
    : (err?.message as string) || (body.detail as string) || (body.message as string) || (body.title as string)
      || ((body.errors as { message?: string }[] | undefined)?.[0]?.message) || (body.raw as string) || `HTTP ${res.status}`;
  const code = typeof err === "object" ? err?.code : undefined;
  const reconnect = res.status === 401 || code === 190 || code === "access_token_invalid" || err === "invalid_grant"
    || body.error === "AuthenticationRequired" || body.error === "ExpiredToken" || body.error === "InvalidToken";
  const retry = !reconnect && (res.status >= 500 || res.status === 429 || code === 1 || code === 2 || code === 4 || code === 17 || code === 32 || code === 613);
  throw new PlatformError(`${label}: ${said}`, reconnect, retry);
}

async function bytes(ctx: Ctx, url: string): Promise<ArrayBuffer> {
  const res = await ctx.fetch(url);
  if (!res.ok) throw new PlatformError(`Couldn't read the file from storage (${res.status})`);
  return res.arrayBuffer();
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export function randomToken(n = 32): string {
  const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a);
}
/** PKCE: the challenge sent with the sign-in link is the SHA-256 of the verifier kept on the server. */
export async function pkceChallenge(verifier: string): Promise<string> {
  return b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
}

// ------------------------------------------------------------------ signing in

export function authorizeUrl(p: Platform, c: Config, state: string, challenge?: string): string {
  const redirect_uri = c.redirectUri;
  switch (p) {
    case "facebook":
      return `https://www.facebook.com/${c.graphVersion}/dialog/oauth?` + qs({
        client_id: c.metaAppId, redirect_uri, state, response_type: "code",
        scope: "pages_show_list,pages_read_engagement,pages_manage_posts"
      });
    case "instagram":
      return "https://www.instagram.com/oauth/authorize?" + qs({
        client_id: c.instagramAppId, redirect_uri, state, response_type: "code", enable_fb_login: 0, force_authentication: 1,
        scope: "instagram_business_basic,instagram_business_content_publish"
      });
    case "youtube":
      return "https://accounts.google.com/o/oauth2/v2/auth?" + qs({
        client_id: c.googleClientId, redirect_uri, state, response_type: "code", access_type: "offline", prompt: "consent",
        include_granted_scopes: "true",
        scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
      });
    case "tiktok":
      return "https://www.tiktok.com/v2/auth/authorize/?" + qs({
        client_key: c.tiktokClientKey, redirect_uri, state, response_type: "code", scope: "user.info.basic,video.publish"
      });
    case "x":
      return "https://x.com/i/oauth2/authorize?" + qs({
        client_id: c.xClientId, redirect_uri, state, response_type: "code", code_challenge: challenge, code_challenge_method: "S256",
        scope: "tweet.read tweet.write users.read media.write offline.access"
      });
    default:
      throw new PlatformError("This one is connected with a form, not a sign-in.", false, false);
  }
}

/** Swaps the code a platform sent back for keys, and reads who the account is. Facebook can give several Pages. */
export async function exchange(ctx: Ctx, p: Platform, c: Config, code: string, verifier?: string | null): Promise<ConnectedAccount[]> {
  const redirect_uri = c.redirectUri;
  switch (p) {
    case "facebook": {
      const short = await call<{ access_token: string }>(ctx, "Facebook", `${graph(c)}/oauth/access_token?` + qs({ client_id: c.metaAppId, client_secret: c.metaAppSecret, redirect_uri, code }));
      const long = await call<{ access_token: string }>(ctx, "Facebook", `${graph(c)}/oauth/access_token?` + qs({ grant_type: "fb_exchange_token", client_id: c.metaAppId, client_secret: c.metaAppSecret, fb_exchange_token: short.access_token }));
      const pages = await call<{ data: { id: string; name: string; access_token: string; link?: string; picture?: { data?: { url?: string } } }[] }>(
        ctx, "Facebook", `${graph(c)}/me/accounts?` + qs({ fields: "id,name,access_token,link,picture{url}", limit: 100, access_token: long.access_token }));
      if (!pages.data?.length) throw new PlatformError("Facebook didn't share any Pages. Sign in again and tick the Reavers Page when Facebook asks which Pages to share.", false, false);
      // A Page key made from a long-lived sign-in doesn't expire.
      return pages.data.map(pg => ({
        platform: "facebook", external_id: pg.id, name: pg.name, avatar_url: pg.picture?.data?.url ?? null,
        profile_url: pg.link || `https://www.facebook.com/${pg.id}`, token: { access_token: pg.access_token }, token_expires_at: null
      }));
    }
    case "instagram": {
      const raw = await call<Record<string, unknown>>(ctx, "Instagram", "https://api.instagram.com/oauth/access_token", form({
        client_id: c.instagramAppId, client_secret: c.instagramAppSecret, grant_type: "authorization_code", redirect_uri, code
      }));
      const short = ((raw.data as Record<string, unknown>[] | undefined)?.[0] ?? raw) as { access_token: string };
      const long = await call<{ access_token: string; expires_in: number }>(ctx, "Instagram", "https://graph.instagram.com/access_token?" + qs({
        grant_type: "ig_exchange_token", client_secret: c.instagramAppSecret, access_token: short.access_token
      }));
      const me = await call<{ user_id: string; username: string; name?: string; profile_picture_url?: string }>(ctx, "Instagram",
        `${igGraph(c)}/me?` + qs({ fields: "user_id,username,name,profile_picture_url", access_token: long.access_token }));
      const expires = inSeconds(ctx, long.expires_in);
      return [{
        platform: "instagram", external_id: String(me.user_id), name: me.name || me.username, handle: me.username,
        avatar_url: me.profile_picture_url ?? null, profile_url: `https://www.instagram.com/${me.username}/`,
        token: { access_token: long.access_token, expires_at: expires }, token_expires_at: expires
      }];
    }
    case "youtube": {
      const t = await call<{ access_token: string; refresh_token?: string; expires_in: number }>(ctx, "Google", "https://oauth2.googleapis.com/token", form({
        code, client_id: c.googleClientId, client_secret: c.googleClientSecret, redirect_uri, grant_type: "authorization_code"
      }));
      if (!t.refresh_token) throw new PlatformError("Google didn't give a lasting key. Remove the Reavers app at myaccount.google.com/permissions and connect again.", false, false);
      const ch = await call<{ items?: { id: string; snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url?: string } } } }[] }>(
        ctx, "YouTube", "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${t.access_token}` } });
      const item = ch.items?.[0];
      if (!item) throw new PlatformError("That Google account has no YouTube channel. Sign in with the account (or brand account) that owns the Reavers channel.", false, false);
      return [{
        platform: "youtube", external_id: item.id, name: item.snippet.title, handle: item.snippet.customUrl ?? null,
        avatar_url: item.snippet.thumbnails?.default?.url ?? null,
        profile_url: item.snippet.customUrl ? `https://www.youtube.com/${item.snippet.customUrl}` : `https://www.youtube.com/channel/${item.id}`,
        token: { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: inSeconds(ctx, t.expires_in) }, token_expires_at: null
      }];
    }
    case "tiktok": {
      const t = await call<{ access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number; open_id: string }>(
        ctx, "TikTok", `${TIKTOK}/oauth/token/`, form({ client_key: c.tiktokClientKey, client_secret: c.tiktokClientSecret, code, grant_type: "authorization_code", redirect_uri }));
      const u = await call<{ data: { user: { open_id: string; display_name?: string; avatar_url?: string } } }>(
        ctx, "TikTok", `${TIKTOK}/user/info/?fields=open_id,display_name,avatar_url`, { headers: { Authorization: `Bearer ${t.access_token}` } });
      return [{
        platform: "tiktok", external_id: t.open_id, name: u.data?.user?.display_name || "TikTok account", avatar_url: u.data?.user?.avatar_url ?? null,
        token: { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: inSeconds(ctx, t.expires_in) },
        token_expires_at: inSeconds(ctx, t.refresh_expires_in)
      }];
    }
    case "x": {
      const t = await call<{ access_token: string; refresh_token?: string; expires_in: number }>(ctx, "X", `${XAPI}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(`${c.xClientId}:${c.xClientSecret}`)}` },
        body: qs({ grant_type: "authorization_code", code, redirect_uri, code_verifier: verifier, client_id: c.xClientId })
      });
      const me = await call<{ data: { id: string; name: string; username: string; profile_image_url?: string } }>(
        ctx, "X", `${XAPI}/users/me?user.fields=profile_image_url`, { headers: { Authorization: `Bearer ${t.access_token}` } });
      return [{
        platform: "x", external_id: me.data.id, name: me.data.name, handle: me.data.username, avatar_url: me.data.profile_image_url ?? null,
        profile_url: `https://x.com/${me.data.username}`,
        token: { access_token: t.access_token, refresh_token: t.refresh_token ?? null, expires_at: inSeconds(ctx, t.expires_in) }, token_expires_at: null
      }];
    }
    default:
      throw new PlatformError("This one is connected with a form, not a sign-in.", false, false);
  }
}

/** Bluesky (handle + app password) and Discord (a channel's webhook address) are connected by pasting them in. */
export async function connectWithForm(ctx: Ctx, p: Platform, fields: Record<string, string>): Promise<ConnectedAccount[]> {
  if (p === "bluesky") {
    const identifier = (fields.handle || "").trim().replace(/^@/, "");
    const password = (fields.password || "").trim();
    const service = (fields.service || "https://bsky.social").trim().replace(/\/+$/, "");
    if (!identifier || !password) throw new PlatformError("Enter the Bluesky handle and an app password.", false, false);
    if (!/^https:\/\//.test(service)) throw new PlatformError("The Bluesky server address has to start with https://", false, false);
    const s = await bskySession(ctx, { access_token: password, extra: { identifier, service } });
    const prof = await call<{ displayName?: string; avatar?: string }>(ctx, "Bluesky", `${BSKY_PUBLIC}/app.bsky.actor.getProfile?actor=${encodeURIComponent(s.did)}`).catch(() => ({} as { displayName?: string; avatar?: string }));
    return [{
      platform: "bluesky", external_id: s.did, name: prof.displayName || s.handle, handle: s.handle, avatar_url: prof.avatar ?? null,
      profile_url: `https://bsky.app/profile/${s.handle}`, token: { access_token: password, extra: { identifier, service } }, token_expires_at: null
    }];
  }
  if (p === "discord") {
    const url = (fields.webhook || "").trim();
    if (!/^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(url))
      throw new PlatformError("That doesn't look like a Discord webhook address. In Discord: Edit Channel → Integrations → Webhooks → Copy Webhook URL.", false, false);
    const w = await call<{ id: string; name: string; channel_id: string; guild_id: string; avatar?: string | null }>(ctx, "Discord", url);
    return [{
      platform: "discord", external_id: w.id, name: w.name, handle: null,
      avatar_url: w.avatar ? `https://cdn.discordapp.com/avatars/${w.id}/${w.avatar}.png` : null,
      profile_url: `https://discord.com/channels/${w.guild_id}/${w.channel_id}`,
      token: { access_token: url, extra: { guild_id: w.guild_id, channel_id: w.channel_id } }, token_expires_at: null
    }];
  }
  throw new PlatformError("This one is connected by signing in.", false, false);
}

// ------------------------------------------------------------------ keeping keys fresh

/** A fresher token when this one is about to run out (null: it's fine as it is). */
export async function refresh(ctx: Ctx, p: Platform, c: Config, t: Token): Promise<{ token: Token; token_expires_at?: string | null } | null> {
  const left = t.expires_at ? Date.parse(t.expires_at) - ctx.now() : Infinity;
  switch (p) {
    case "instagram": {
      // Long-lived Instagram keys last 60 days and can be renewed once they're a day old: renew with 15 days to go.
      if (left > 15 * 86400e3) return null;
      const r = await call<{ access_token: string; expires_in: number }>(ctx, "Instagram", "https://graph.instagram.com/refresh_access_token?" + qs({ grant_type: "ig_refresh_token", access_token: t.access_token }));
      const exp = inSeconds(ctx, r.expires_in);
      return { token: { ...t, access_token: r.access_token, expires_at: exp }, token_expires_at: exp };
    }
    case "youtube": {
      if (left > 5 * 60e3) return null;
      if (!t.refresh_token) throw new PlatformError("YouTube needs connecting again.", true, false);
      const r = await call<{ access_token: string; expires_in: number }>(ctx, "Google", "https://oauth2.googleapis.com/token", form({
        client_id: c.googleClientId, client_secret: c.googleClientSecret, refresh_token: t.refresh_token, grant_type: "refresh_token"
      }));
      return { token: { ...t, access_token: r.access_token, expires_at: inSeconds(ctx, r.expires_in) } };
    }
    case "tiktok": {
      if (left > 30 * 60e3) return null;
      if (!t.refresh_token) throw new PlatformError("TikTok needs connecting again.", true, false);
      const r = await call<{ access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number }>(ctx, "TikTok", `${TIKTOK}/oauth/token/`, form({
        client_key: c.tiktokClientKey, client_secret: c.tiktokClientSecret, grant_type: "refresh_token", refresh_token: t.refresh_token
      }));
      return { token: { ...t, access_token: r.access_token, refresh_token: r.refresh_token, expires_at: inSeconds(ctx, r.expires_in) }, token_expires_at: inSeconds(ctx, r.refresh_expires_in) };
    }
    case "x": {
      if (left > 5 * 60e3) return null;
      if (!t.refresh_token) throw new PlatformError("X needs connecting again.", true, false);
      const r = await call<{ access_token: string; refresh_token?: string; expires_in: number }>(ctx, "X", `${XAPI}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(`${c.xClientId}:${c.xClientSecret}`)}` },
        body: qs({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: c.xClientId })
      });
      // X hands out a new refresh token each time; the old one stops working.
      return { token: { ...t, access_token: r.access_token, refresh_token: r.refresh_token ?? t.refresh_token, expires_at: inSeconds(ctx, r.expires_in) } };
    }
    default:
      return null;
  }
}

// ------------------------------------------------------------------ posting

export async function publish(ctx: Ctx, p: Platform, c: Config, post: PostDraft, account: AccountRef, t: Token): Promise<Published> {
  switch (p) {
    case "facebook": return facebook(ctx, c, post, account, t);
    case "instagram": return instagram(ctx, c, post, account, t);
    case "youtube": return youtube(ctx, post, t);
    case "tiktok": return tiktok(ctx, post, account, t);
    case "x": return xPost(ctx, post, account, t);
    case "bluesky": return bluesky(ctx, post, t);
    case "discord": return discord(ctx, post, t);
  }
}

async function facebook(ctx: Ctx, c: Config, post: PostDraft, a: AccountRef, t: Token): Promise<Published> {
  const text = textFor(post, "facebook");
  const images = post.media.filter(m => m.kind === "image");
  const video = post.media.find(m => m.kind === "video");
  const page = a.external_id;
  if (video) {
    const r = await call<{ id: string }>(ctx, "Facebook", `${graphVideo(c)}/${page}/videos`, form({ file_url: video.url, description: text, access_token: t.access_token }));
    return { external_id: r.id, url: `https://www.facebook.com/${page}/videos/${r.id}` };
  }
  if (images.length === 1) {
    const r = await call<{ id: string; post_id?: string }>(ctx, "Facebook", `${graph(c)}/${page}/photos`, form({ url: images[0].url, caption: text, access_token: t.access_token }));
    const id = r.post_id || r.id;
    return { external_id: id, url: `https://www.facebook.com/${id}` };
  }
  const params: Record<string, string> = { message: text, access_token: t.access_token };
  if (images.length > 1) {
    // Several photos: upload each without posting it, then one post with all of them.
    const ids: string[] = [];
    for (const img of images) {
      const r = await call<{ id: string }>(ctx, "Facebook", `${graph(c)}/${page}/photos`, form({ url: img.url, published: false, access_token: t.access_token }));
      ids.push(r.id);
    }
    ids.forEach((id, i) => { params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }); });
  } else if (post.link_url) {
    params.link = post.link_url;
  }
  const r = await call<{ id: string }>(ctx, "Facebook", `${graph(c)}/${page}/feed`, form(params));
  return { external_id: r.id, url: `https://www.facebook.com/${r.id}` };
}

/** Waits for Instagram to finish fetching a photo or video before it can be published. */
async function igReady(ctx: Ctx, c: Config, id: string, t: Token, video: boolean) {
  const tries = video ? 60 : 12;
  for (let i = 0; i < tries; i++) {
    const s = await call<{ status_code?: string; status?: string }>(ctx, "Instagram", `${igGraph(c)}/${id}?` + qs({ fields: "status_code,status", access_token: t.access_token }));
    if (s.status_code === "FINISHED" || s.status_code === "PUBLISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED")
      throw new PlatformError(`Instagram couldn't use the ${video ? "video" : "photo"} (${s.status || s.status_code}). Reels need an MP4 or MOV, 3 seconds to 15 minutes.`, false, false);
    await ctx.wait(video ? 5000 : 2000);
  }
  throw new PlatformError("Instagram is still processing the video. It'll be tried again in a few minutes.");
}

async function instagram(ctx: Ctx, c: Config, post: PostDraft, a: AccountRef, t: Token): Promise<Published> {
  const caption = textFor(post, "instagram");
  const images = post.media.filter(m => m.kind === "image");
  const video = post.media.find(m => m.kind === "video");
  const base = `${igGraph(c)}/${a.external_id}`;
  let container: string;
  if (video) {
    container = (await call<{ id: string }>(ctx, "Instagram", `${base}/media`, form({ media_type: "REELS", video_url: video.url, caption, share_to_feed: true, access_token: t.access_token }))).id;
    await igReady(ctx, c, container, t, true);
  } else if (images.length === 1) {
    container = (await call<{ id: string }>(ctx, "Instagram", `${base}/media`, form({ image_url: images[0].url, caption, alt_text: images[0].alt, access_token: t.access_token }))).id;
    await igReady(ctx, c, container, t, false);
  } else if (images.length > 1) {
    const children: string[] = [];
    for (const img of images) {
      const id = (await call<{ id: string }>(ctx, "Instagram", `${base}/media`, form({ image_url: img.url, is_carousel_item: true, alt_text: img.alt, access_token: t.access_token }))).id;
      await igReady(ctx, c, id, t, false);
      children.push(id);
    }
    container = (await call<{ id: string }>(ctx, "Instagram", `${base}/media`, form({ media_type: "CAROUSEL", children: children.join(","), caption, access_token: t.access_token }))).id;
    await igReady(ctx, c, container, t, false);
  } else {
    throw new PlatformError("Instagram needs a photo or a video.", false, false);
  }
  const done = await call<{ id: string }>(ctx, "Instagram", `${base}/media_publish`, form({ creation_id: container, access_token: t.access_token }));
  const link = await call<{ permalink?: string }>(ctx, "Instagram", `${igGraph(c)}/${done.id}?` + qs({ fields: "permalink", access_token: t.access_token })).catch(() => ({} as { permalink?: string }));
  return { external_id: done.id, url: link.permalink ?? null };
}

async function youtube(ctx: Ctx, post: PostDraft, t: Token): Promise<Published> {
  const video = post.media.find(m => m.kind === "video");
  if (!video) throw new PlatformError("YouTube needs a video.", false, false);
  const privacy = post.options?.youtube_privacy || "public";
  const start = await ctx.fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(video.size), "X-Upload-Content-Type": video.mime
    },
    body: JSON.stringify({
      // Category 17 is Sports.
      snippet: { title: youtubeTitle(post), description: textFor(post, "youtube"), categoryId: "17" },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false }
    })
  });
  if (!start.ok) {
    const b = await start.json().catch(() => ({}));
    const msg = b?.error?.message || `HTTP ${start.status}`;
    const reason = b?.error?.errors?.[0]?.reason;
    throw new PlatformError(`YouTube: ${msg}`, start.status === 401, start.status >= 500 || reason === "quotaExceeded" || reason === "uploadLimitExceeded");
  }
  const upload = start.headers.get("Location");
  if (!upload) throw new PlatformError("YouTube didn't give an upload address.");
  const file = await ctx.fetch(video.url);
  if (!file.ok || !file.body) throw new PlatformError(`Couldn't read the video from storage (${file.status})`);
  const done = await call<{ id: string; status?: { privacyStatus?: string } }>(ctx, "YouTube", upload, {
    method: "PUT", headers: { "Content-Type": video.mime, "Content-Length": String(video.size) }, body: file.body,
    // Streams the file instead of holding it all in memory.
    duplex: "half"
  } as RequestInit);
  const kept = done.status?.privacyStatus;
  return {
    external_id: done.id, url: `https://youtu.be/${done.id}`,
    note: kept && kept !== privacy ? `YouTube set it to ${kept}. Uploads stay private until Google's API audit passes.` : null
  };
}

async function tiktok(ctx: Ctx, post: PostDraft, a: AccountRef, t: Token): Promise<Published> {
  const video = post.media.find(m => m.kind === "video");
  if (!video) throw new PlatformError("TikTok needs a video.", false, false);
  const info = await call<{ data: { privacy_level_options?: string[]; creator_username?: string; max_video_post_duration_sec?: number } }>(
    ctx, "TikTok", `${TIKTOK}/post/publish/creator_info/query/`, jsonPost({}, t.access_token));
  const options = info.data?.privacy_level_options || ["SELF_ONLY"];
  const want: TiktokPrivacy = post.options?.tiktok_privacy || "PUBLIC_TO_EVERYONE";
  const privacy = options.includes(want) ? want : options.includes("SELF_ONLY") ? "SELF_ONLY" : options[0];
  const file = await bytes(ctx, video.url);
  const size = file.byteLength;
  const init = await call<{ data: { publish_id: string; upload_url: string } }>(ctx, "TikTok", `${TIKTOK}/post/publish/video/init/`, jsonPost({
    post_info: { title: textFor(post, "tiktok").slice(0, 2200), privacy_level: privacy, disable_duet: false, disable_comment: false, disable_stitch: false },
    // One piece: TikTok takes a whole file in one go up to 64 MB.
    source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 }
  }, t.access_token));
  const put = await ctx.fetch(init.data.upload_url, {
    method: "PUT", headers: { "Content-Type": video.mime, "Content-Length": String(size), "Content-Range": `bytes 0-${size - 1}/${size}` }, body: file
  });
  if (!put.ok) throw new PlatformError(`TikTok didn't take the video (${put.status})`);
  const username = info.data?.creator_username || a.handle || null;
  for (let i = 0; i < 24; i++) {
    const s = await call<{ data: { status: string; fail_reason?: string; publicaly_available_post_id?: (string | number)[] } }>(
      ctx, "TikTok", `${TIKTOK}/post/publish/status/fetch/`, jsonPost({ publish_id: init.data.publish_id }, t.access_token));
    if (s.data.status === "FAILED") throw new PlatformError(`TikTok: ${s.data.fail_reason || "the post failed"}`, false, false);
    if (s.data.status === "PUBLISH_COMPLETE") {
      const id = s.data.publicaly_available_post_id?.[0];
      return {
        external_id: id ? String(id) : init.data.publish_id,
        url: id && username ? `https://www.tiktok.com/@${username}/video/${id}` : username ? `https://www.tiktok.com/@${username}` : null,
        note: privacy !== want ? "TikTok only allowed Only me. Posts can be public once TikTok's audit passes." : null
      };
    }
    await ctx.wait(5000);
  }
  // Still processing after two minutes: it's on its way, TikTok finishes on its own.
  return { external_id: init.data.publish_id, url: username ? `https://www.tiktok.com/@${username}` : null, note: "TikTok was still processing it." };
}

async function xPost(ctx: Ctx, post: PostDraft, a: AccountRef, t: Token): Promise<Published> {
  const images = post.media.filter(m => m.kind === "image").slice(0, 4);
  const media_ids: string[] = [];
  for (const img of images) {
    const fd = new FormData();
    fd.append("media", new Blob([await bytes(ctx, img.url)], { type: img.mime }), img.name || "photo");
    fd.append("media_category", "tweet_image");
    const r = await call<{ data: { id: string } }>(ctx, "X", `${XAPI}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${t.access_token}` }, body: fd });
    media_ids.push(r.data.id);
  }
  const body: Record<string, unknown> = { text: textFor(post, "x") };
  if (media_ids.length) body.media = { media_ids };
  const r = await call<{ data: { id: string } }>(ctx, "X", `${XAPI}/tweets`, jsonPost(body, t.access_token));
  return { external_id: r.data.id, url: `https://x.com/${a.handle || "i/web"}/status/${r.data.id}` };
}

async function bskySession(ctx: Ctx, t: Token) {
  const service = String(t.extra?.service || "https://bsky.social");
  const s = await call<{ did: string; handle: string; accessJwt: string }>(ctx, "Bluesky", `${service}/xrpc/com.atproto.server.createSession`,
    jsonPost({ identifier: t.extra?.identifier, password: t.access_token }));
  return { ...s, service };
}

async function bluesky(ctx: Ctx, post: PostDraft, t: Token): Promise<Published> {
  const s = await bskySession(ctx, t);
  const text = textFor(post, "bluesky");
  const record: Record<string, unknown> = { $type: "app.bsky.feed.post", text, createdAt: new Date(ctx.now()).toISOString(), langs: ["en"] };
  const facets = blueskyLinkFacets(text);
  if (facets.length) record.facets = facets;
  const images = post.media.filter(m => m.kind === "image").slice(0, 4);
  if (images.length) {
    const list = [];
    for (const img of images) {
      const up = await call<{ blob: unknown }>(ctx, "Bluesky", `${s.service}/xrpc/com.atproto.repo.uploadBlob`, {
        method: "POST", headers: { "Content-Type": img.mime, Authorization: `Bearer ${s.accessJwt}` }, body: await bytes(ctx, img.url)
      });
      list.push({ alt: img.alt || "", image: up.blob });
    }
    record.embed = { $type: "app.bsky.embed.images", images: list };
  } else if (post.link_url) {
    let host = post.link_url;
    try { host = new URL(post.link_url).hostname; } catch { /* keep the address */ }
    record.embed = { $type: "app.bsky.embed.external", external: { uri: post.link_url, title: host, description: "" } };
  }
  const r = await call<{ uri: string }>(ctx, "Bluesky", `${s.service}/xrpc/com.atproto.repo.createRecord`,
    jsonPost({ repo: s.did, collection: "app.bsky.feed.post", record }, s.accessJwt));
  return { external_id: r.uri, url: `https://bsky.app/profile/${s.handle}/post/${r.uri.split("/").pop()}` };
}

async function discord(ctx: Ctx, post: PostDraft, t: Token): Promise<Published> {
  let content = textFor(post, "discord");
  const images = post.media.filter(m => m.kind === "image").slice(0, 10);
  const video = post.media.find(m => m.kind === "video");
  // Discord plays a video from its address right in the channel.
  if (video) content = content ? `${content}\n${video.url}` : video.url;
  const r = await call<{ id: string; channel_id: string }>(ctx, "Discord", `${t.access_token}?wait=true`, jsonPost({
    content: content.slice(0, 2000), allowed_mentions: { parse: [] },
    embeds: images.map(i => ({ image: { url: i.url } }))
  }));
  const guild = t.extra?.guild_id;
  return { external_id: r.id, url: guild ? `https://discord.com/channels/${guild}/${r.channel_id}/${r.id}` : null };
}

// ------------------------------------------------------------------ likes, comments and views

/** Numbers for one live post, or null where the platform doesn't give them here (X charges per read; TikTok and Discord don't share them). */
export async function stats(ctx: Ctx, p: Platform, c: Config, externalId: string, t: Token): Promise<PostStats | null> {
  switch (p) {
    case "facebook": {
      const r = await call<{ reactions?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } }; shares?: { count?: number } }>(
        ctx, "Facebook", `${graph(c)}/${externalId}?` + qs({ fields: "reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares", access_token: t.access_token }));
      return { likes: r.reactions?.summary?.total_count ?? 0, comments: r.comments?.summary?.total_count ?? 0, shares: r.shares?.count ?? 0 };
    }
    case "instagram": {
      const r = await call<{ like_count?: number; comments_count?: number }>(ctx, "Instagram", `${igGraph(c)}/${externalId}?` + qs({ fields: "like_count,comments_count", access_token: t.access_token }));
      return { likes: r.like_count ?? 0, comments: r.comments_count ?? 0 };
    }
    case "youtube": {
      const r = await call<{ items?: { statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }[] }>(
        ctx, "YouTube", `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(externalId)}`, { headers: { Authorization: `Bearer ${t.access_token}` } });
      const s = r.items?.[0]?.statistics;
      return s ? { views: Number(s.viewCount ?? 0), likes: Number(s.likeCount ?? 0), comments: Number(s.commentCount ?? 0) } : null;
    }
    case "bluesky": {
      const r = await call<{ posts?: { likeCount?: number; replyCount?: number; repostCount?: number; quoteCount?: number }[] }>(
        ctx, "Bluesky", `${BSKY_PUBLIC}/app.bsky.feed.getPosts?uris=${encodeURIComponent(externalId)}`);
      const s = r.posts?.[0];
      return s ? { likes: s.likeCount ?? 0, comments: s.replyCount ?? 0, shares: (s.repostCount ?? 0) + (s.quoteCount ?? 0) } : null;
    }
    default:
      return null;
  }
}

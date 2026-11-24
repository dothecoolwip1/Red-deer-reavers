import { describe, expect, it } from "vitest";
import { authorizeUrl, connectWithForm, exchange, pkceChallenge, PlatformError, publish, refresh, stats, type Config, type Ctx } from "../../supabase/functions/_shared/socialPlatforms";
import type { MediaItem, PostDraft } from "./social";

// A stand-in for each platform: answers by method and address, and keeps every request so the tests can check what was sent.
type Call = { method: string; url: string; headers: Record<string, string>; body: string };
function fake(routes: [string, string | RegExp, unknown | ((c: Call) => unknown), number?][]) {
  const calls: Call[] = [];
  const ctx: Ctx = {
    now: () => Date.parse("2026-11-24T18:00:00Z"),
    wait: async () => undefined,
    fetch: (async (input: string, init: RequestInit = {}) => {
      const url = String(input);
      const method = (init.method || "GET").toUpperCase();
      const body = typeof init.body === "string" ? init.body : init.body instanceof FormData ? `[form ${[...init.body.keys()].join(",")}]` : init.body ? "[bytes]" : "";
      const c: Call = { method, url, headers: Object.fromEntries(new Headers(init.headers).entries()), body };
      calls.push(c);
      const r = routes.find(([m, u]) => m === method && (typeof u === "string" ? url.startsWith(u) : u.test(url)));
      if (!r) return new Response(JSON.stringify({ error: { message: `no route for ${method} ${url}` } }), { status: 404 });
      const out = typeof r[2] === "function" ? (r[2] as (c: Call) => unknown)(c) : r[2];
      if (out instanceof Response) return out;
      return new Response(typeof out === "string" ? out : JSON.stringify(out), { status: r[3] ?? 200 });
    }) as typeof fetch
  };
  return { ctx, calls };
}
const form = (c: Call) => Object.fromEntries(new URLSearchParams(c.body));
const query = (c: Call) => Object.fromEntries(new URL(c.url).searchParams);

const cfg: Config = {
  redirectUri: "https://api-home.buhurtoshome.app/functions/v1/reavers-social", graphVersion: "v23.0",
  metaAppId: "meta-id", metaAppSecret: "meta-secret", instagramAppId: "ig-id", instagramAppSecret: "ig-secret",
  googleClientId: "g-id", googleClientSecret: "g-secret", tiktokClientKey: "tt-key", tiktokClientSecret: "tt-secret",
  xClientId: "x-id", xClientSecret: "x-secret"
};
const img = (n: number): MediaItem => ({ url: `https://store.test/p${n}.jpg`, path: `p${n}.jpg`, kind: "image", mime: "image/jpeg", size: 1000, name: `p${n}.jpg` });
const video: MediaItem = { url: "https://store.test/v.mp4", path: "v.mp4", kind: "video", mime: "video/mp4", size: 4, name: "v.mp4" };
const post = (o: Partial<PostDraft> = {}): PostDraft => ({ body: "Rumble tickets are live", media: [], ...o });
const tok = { access_token: "TOKEN" };

describe("sign-in links", () => {
  it("asks each platform for posting permission and sends people back to the function", () => {
    const fb = new URL(authorizeUrl("facebook", cfg, "s1"));
    expect(fb.origin + fb.pathname).toBe("https://www.facebook.com/v23.0/dialog/oauth");
    expect(fb.searchParams.get("scope")).toBe("pages_show_list,pages_read_engagement,pages_manage_posts");
    expect(fb.searchParams.get("redirect_uri")).toBe(cfg.redirectUri);
    expect(new URL(authorizeUrl("instagram", cfg, "s")).searchParams.get("scope")).toBe("instagram_business_basic,instagram_business_content_publish");
    const yt = new URL(authorizeUrl("youtube", cfg, "s"));
    expect(yt.searchParams.get("access_type")).toBe("offline");
    expect(yt.searchParams.get("scope")).toContain("youtube.upload");
    expect(new URL(authorizeUrl("tiktok", cfg, "s")).searchParams.get("client_key")).toBe("tt-key");
    const x = new URL(authorizeUrl("x", cfg, "s", "CH"));
    expect(x.searchParams.get("code_challenge")).toBe("CH");
    expect(x.searchParams.get("scope")).toContain("media.write");
    expect(() => authorizeUrl("bluesky", cfg, "s")).toThrow(PlatformError);
  });
  it("makes the PKCE challenge as SHA-256 in base64url", async () => {
    // Base64url SHA-256, checked against Python: base64.urlsafe_b64encode(hashlib.sha256(v).digest()).rstrip("=").
    expect(await pkceChallenge("dBjftJeZ4CVP-mJ92K9qEo2q2Ydu7Y0f_7yJ2a3Q3W4")).toBe("O5RMfkKJf4GW-9K6m1ZhpQLucSZaDJU_Cn6p1D8J5Yk");
  });
});

describe("connecting", () => {
  it("Facebook: swaps the code, makes it long-lived and lists the Pages with their own keys", async () => {
    const { ctx, calls } = fake([
      ["GET", /oauth\/access_token\?.*fb_exchange_token/, { access_token: "LONG" }],
      ["GET", "https://graph.facebook.com/v23.0/oauth/access_token", { access_token: "SHORT" }],
      ["GET", "https://graph.facebook.com/v23.0/me/accounts", { data: [{ id: "123", name: "Red Deer Reavers", access_token: "PAGE", picture: { data: { url: "https://pic" } } }] }]
    ]);
    const [a] = await exchange(ctx, "facebook", cfg, "CODE");
    expect(a).toMatchObject({ platform: "facebook", external_id: "123", name: "Red Deer Reavers", token: { access_token: "PAGE" }, avatar_url: "https://pic" });
    expect(query(calls[0])).toMatchObject({ code: "CODE", client_secret: "meta-secret", redirect_uri: cfg.redirectUri });
    expect(query(calls[2]).access_token).toBe("LONG");
  });
  it("Facebook: says so when no Page was shared", async () => {
    const { ctx } = fake([
      ["GET", /fb_exchange_token/, { access_token: "LONG" }],
      ["GET", "https://graph.facebook.com/v23.0/oauth/access_token", { access_token: "SHORT" }],
      ["GET", "https://graph.facebook.com/v23.0/me/accounts", { data: [] }]
    ]);
    await expect(exchange(ctx, "facebook", cfg, "CODE")).rejects.toThrow(/didn't share any Pages/);
  });
  it("Instagram: gets a 60-day key and the professional account id", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://api.instagram.com/oauth/access_token", { data: [{ access_token: "SHORT", user_id: 1 }] }],
      ["GET", "https://graph.instagram.com/access_token", { access_token: "LONG", expires_in: 5184000 }],
      ["GET", "https://graph.instagram.com/v23.0/me", { user_id: "1789", username: "red_deer_reavers", profile_picture_url: "https://p" }]
    ]);
    const [a] = await exchange(ctx, "instagram", cfg, "CODE");
    expect(a).toMatchObject({ external_id: "1789", handle: "red_deer_reavers", token: { access_token: "LONG" }, token_expires_at: "2027-01-23T18:00:00.000Z" });
    expect(form(calls[0])).toMatchObject({ grant_type: "authorization_code", code: "CODE", client_id: "ig-id" });
  });
  it("YouTube: needs a refresh token and a channel", async () => {
    const { ctx } = fake([
      ["POST", "https://oauth2.googleapis.com/token", { access_token: "A", refresh_token: "R", expires_in: 3600 }],
      ["GET", "https://www.googleapis.com/youtube/v3/channels", { items: [{ id: "UC1", snippet: { title: "Reavers", customUrl: "@reddeerreavers" } }] }]
    ]);
    const [a] = await exchange(ctx, "youtube", cfg, "CODE");
    expect(a).toMatchObject({ external_id: "UC1", profile_url: "https://www.youtube.com/@reddeerreavers", token: { refresh_token: "R" } });
  });
  it("X: sends the PKCE verifier with the app's own key", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://api.x.com/2/oauth2/token", { access_token: "A", refresh_token: "R", expires_in: 7200 }],
      ["GET", "https://api.x.com/2/users/me", { data: { id: "9", name: "Reavers", username: "rdreavers" } }]
    ]);
    const [a] = await exchange(ctx, "x", cfg, "CODE", "VERIFIER");
    expect(a.handle).toBe("rdreavers");
    expect(form(calls[0]).code_verifier).toBe("VERIFIER");
    expect(calls[0].headers.authorization).toBe(`Basic ${btoa("x-id:x-secret")}`);
  });
  it("Bluesky: checks the app password by signing in", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://bsky.social/xrpc/com.atproto.server.createSession", { did: "did:plc:abc", handle: "reavers.bsky.social", accessJwt: "J" }],
      ["GET", "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile", { displayName: "Red Deer Reavers" }]
    ]);
    const [a] = await connectWithForm(ctx, "bluesky", { handle: "@reavers.bsky.social", password: "abcd-efgh-ijkl-mnop" });
    expect(a).toMatchObject({ external_id: "did:plc:abc", name: "Red Deer Reavers", token: { access_token: "abcd-efgh-ijkl-mnop", extra: { identifier: "reavers.bsky.social" } } });
    expect(JSON.parse(calls[0].body)).toEqual({ identifier: "reavers.bsky.social", password: "abcd-efgh-ijkl-mnop" });
  });
  it("Discord: only takes a real webhook address", async () => {
    const { ctx } = fake([["GET", "https://discord.com/api/webhooks/111/tok", { id: "111", name: "Announcements", channel_id: "5", guild_id: "4" }]]);
    await expect(connectWithForm(ctx, "discord", { webhook: "https://evil.test/api/webhooks/1/x" })).rejects.toThrow(/doesn't look like/);
    const [a] = await connectWithForm(ctx, "discord", { webhook: "https://discord.com/api/webhooks/111/tok" });
    expect(a).toMatchObject({ external_id: "111", profile_url: "https://discord.com/channels/4/5" });
  });
});

describe("posting", () => {
  it("Facebook: text with a link goes to the Page feed", async () => {
    const { ctx, calls } = fake([["POST", "https://graph.facebook.com/v23.0/123/feed", { id: "123_456" }]]);
    const r = await publish(ctx, "facebook", cfg, post({ link_url: "https://reddeerreavers.com/" }), { external_id: "123", name: "Reavers" }, tok);
    expect(r).toEqual({ external_id: "123_456", url: "https://www.facebook.com/123_456" });
    expect(form(calls[0])).toMatchObject({ message: "Rumble tickets are live\n\nhttps://reddeerreavers.com/", link: "https://reddeerreavers.com/", access_token: "TOKEN" });
  });
  it("Facebook: several photos are uploaded unpublished, then attached to one post", async () => {
    let n = 0;
    const { ctx, calls } = fake([
      ["POST", "https://graph.facebook.com/v23.0/123/photos", () => ({ id: `ph${++n}` })],
      ["POST", "https://graph.facebook.com/v23.0/123/feed", { id: "123_9" }]
    ]);
    await publish(ctx, "facebook", cfg, post({ media: [img(1), img(2)] }), { external_id: "123", name: "R" }, tok);
    expect(form(calls[0])).toMatchObject({ url: "https://store.test/p1.jpg", published: "false" });
    expect(form(calls[2])).toMatchObject({ "attached_media[0]": '{"media_fbid":"ph1"}', "attached_media[1]": '{"media_fbid":"ph2"}' });
  });
  it("Facebook: a video goes to the video host by its address", async () => {
    const { ctx, calls } = fake([["POST", "https://graph-video.facebook.com/v23.0/123/videos", { id: "v1" }]]);
    const r = await publish(ctx, "facebook", cfg, post({ media: [video] }), { external_id: "123", name: "R" }, tok);
    expect(r.url).toBe("https://www.facebook.com/123/videos/v1");
    expect(form(calls[0]).file_url).toBe(video.url);
  });
  it("Facebook: an expired key means connecting again", async () => {
    const { ctx } = fake([["POST", "https://graph.facebook.com/v23.0/123/feed", { error: { message: "Error validating access token", code: 190 } }, 400]]);
    const e = await publish(ctx, "facebook", cfg, post(), { external_id: "123", name: "R" }, tok).catch(x => x);
    expect(e).toBeInstanceOf(PlatformError);
    expect(e).toMatchObject({ reconnect: true, retry: false, message: "Facebook: Error validating access token" });
  });
  it("Instagram: a carousel makes each photo, waits for it, then publishes the carousel", async () => {
    let n = 0;
    const { ctx, calls } = fake([
      ["POST", "https://graph.instagram.com/v23.0/1789/media_publish", { id: "M1" }],
      ["POST", "https://graph.instagram.com/v23.0/1789/media", () => ({ id: `c${++n}` })],
      ["GET", /graph\.instagram\.com\/v23\.0\/c\d\?/, { status_code: "FINISHED" }],
      ["GET", "https://graph.instagram.com/v23.0/M1", { permalink: "https://www.instagram.com/p/abc/" }]
    ]);
    const r = await publish(ctx, "instagram", cfg, post({ media: [img(1), img(2)] }), { external_id: "1789", name: "R" }, tok);
    expect(r).toEqual({ external_id: "M1", url: "https://www.instagram.com/p/abc/" });
    const creates = calls.filter(c => c.method === "POST" && c.url.endsWith("/media")).map(form);
    expect(creates[0]).toMatchObject({ image_url: "https://store.test/p1.jpg", is_carousel_item: "true" });
    expect(creates[2]).toMatchObject({ media_type: "CAROUSEL", children: "c1,c2", caption: "Rumble tickets are live" });
    expect(form(calls.find(c => c.url.endsWith("/media_publish"))!).creation_id).toBe("c3");
  });
  it("Instagram: a video is a Reel, and a processing error is not retried", async () => {
    const { ctx } = fake([
      ["POST", "https://graph.instagram.com/v23.0/1789/media", { id: "c1" }],
      ["GET", /c1\?/, { status_code: "ERROR", status: "Error: unsupported codec" }]
    ]);
    const e = await publish(ctx, "instagram", cfg, post({ media: [video] }), { external_id: "1789", name: "R" }, tok).catch(x => x);
    expect(e).toMatchObject({ retry: false });
    expect(e.message).toMatch(/unsupported codec/);
  });
  it("YouTube: starts a resumable upload, streams the file, and says when Google kept it private", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://www.googleapis.com/upload/youtube/v3/videos", () => new Response("", { status: 200, headers: { Location: "https://upload.test/session1" } })],
      ["GET", "https://store.test/v.mp4", "abcd"],
      ["PUT", "https://upload.test/session1", { id: "vid9", status: { privacyStatus: "private" } }]
    ]);
    const r = await publish(ctx, "youtube", cfg, post({ media: [video], options: { youtube_privacy: "public" } }), { external_id: "UC1", name: "R" }, tok);
    expect(r).toMatchObject({ external_id: "vid9", url: "https://youtu.be/vid9" });
    expect(r.note).toMatch(/private/);
    const meta = JSON.parse(calls[0].body);
    expect(meta).toMatchObject({ snippet: { title: "Rumble tickets are live", categoryId: "17" }, status: { privacyStatus: "public" } });
    expect(calls[0].headers["x-upload-content-length"]).toBe("4");
    expect(calls[2].headers["content-length"]).toBe("4");
  });
  it("TikTok: falls back to Only me when public isn't allowed yet, uploads in one piece and waits", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://open.tiktokapis.com/v2/post/publish/creator_info/query/", { data: { privacy_level_options: ["SELF_ONLY"], creator_username: "reavers" }, error: { code: "ok" } }],
      ["GET", "https://store.test/v.mp4", "abcd"],
      ["POST", "https://open.tiktokapis.com/v2/post/publish/video/init/", { data: { publish_id: "pub1", upload_url: "https://up.tiktok.test/1" }, error: { code: "ok" } }],
      ["PUT", "https://up.tiktok.test/1", ""],
      ["POST", "https://open.tiktokapis.com/v2/post/publish/status/fetch/", { data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: [777] }, error: { code: "ok" } }]
    ]);
    const r = await publish(ctx, "tiktok", cfg, post({ media: [video] }), { external_id: "open1", name: "R" }, tok);
    expect(r).toMatchObject({ external_id: "777", url: "https://www.tiktok.com/@reavers/video/777" });
    expect(r.note).toMatch(/Only me/);
    const init = JSON.parse(calls[2].body);
    expect(init.post_info.privacy_level).toBe("SELF_ONLY");
    expect(init.source_info).toEqual({ source: "FILE_UPLOAD", video_size: 4, chunk_size: 4, total_chunk_count: 1 });
    expect(calls[3].headers["content-range"]).toBe("bytes 0-3/4");
  });
  it("TikTok: an error code in the body is an error", async () => {
    const { ctx } = fake([["POST", "https://open.tiktokapis.com/v2/post/publish/creator_info/query/", { error: { code: "access_token_invalid", message: "The access token is invalid" } }, 401]]);
    const e = await publish(ctx, "tiktok", cfg, post({ media: [video] }), { external_id: "o", name: "R" }, tok).catch(x => x);
    expect(e).toMatchObject({ reconnect: true });
  });
  it("X: uploads photos, then posts with their ids", async () => {
    const { ctx, calls } = fake([
      ["GET", "https://store.test/p1.jpg", "jpg"],
      ["POST", "https://api.x.com/2/media/upload", { data: { id: "m1" } }],
      ["POST", "https://api.x.com/2/tweets", { data: { id: "t1" } }]
    ]);
    const r = await publish(ctx, "x", cfg, post({ media: [img(1)] }), { external_id: "9", name: "R", handle: "rdreavers" }, tok);
    expect(r.url).toBe("https://x.com/rdreavers/status/t1");
    expect(calls[1].body).toBe("[form media,media_category]");
    expect(JSON.parse(calls[2].body)).toEqual({ text: "Rumble tickets are live", media: { media_ids: ["m1"] } });
  });
  it("Bluesky: signs in, makes the link clickable and posts", async () => {
    const { ctx, calls } = fake([
      ["POST", "https://bsky.social/xrpc/com.atproto.server.createSession", { did: "did:plc:abc", handle: "reavers.bsky.social", accessJwt: "J" }],
      ["POST", "https://bsky.social/xrpc/com.atproto.repo.createRecord", { uri: "at://did:plc:abc/app.bsky.feed.post/3kxyz" }]
    ]);
    const r = await publish(ctx, "bluesky", cfg, post({ link_url: "https://reddeerreavers.com/" }), { external_id: "did:plc:abc", name: "R" },
      { access_token: "pw", extra: { identifier: "reavers.bsky.social", service: "https://bsky.social" } });
    expect(r.url).toBe("https://bsky.app/profile/reavers.bsky.social/post/3kxyz");
    const rec = JSON.parse(calls[1].body);
    expect(rec.repo).toBe("did:plc:abc");
    expect(rec.record.facets[0].features[0].uri).toBe("https://reddeerreavers.com/");
    expect(rec.record.embed.$type).toBe("app.bsky.embed.external");
    expect(calls[1].headers.authorization).toBe("Bearer J");
  });
  it("Discord: posts to the webhook with photos as embeds and no pings", async () => {
    const { ctx, calls } = fake([["POST", "https://discord.com/api/webhooks/111/tok?wait=true", { id: "m5", channel_id: "5" }]]);
    const r = await publish(ctx, "discord", cfg, post({ body: "@everyone hi", media: [img(1)] }), { external_id: "111", name: "R" },
      { access_token: "https://discord.com/api/webhooks/111/tok", extra: { guild_id: "4" } });
    expect(r.url).toBe("https://discord.com/channels/4/5/m5");
    const b = JSON.parse(calls[0].body);
    expect(b.allowed_mentions).toEqual({ parse: [] });
    expect(b.embeds).toEqual([{ image: { url: "https://store.test/p1.jpg" } }]);
  });
});

describe("keys and numbers", () => {
  it("renews Instagram keys with 15 days to go, not before", async () => {
    const { ctx, calls } = fake([["GET", "https://graph.instagram.com/refresh_access_token", { access_token: "NEW", expires_in: 5184000 }]]);
    expect(await refresh(ctx, "instagram", cfg, { access_token: "OLD", expires_at: "2027-01-01T00:00:00Z" })).toBeNull();
    const r = await refresh(ctx, "instagram", cfg, { access_token: "OLD", expires_at: "2026-12-01T00:00:00Z" });
    expect(r?.token.access_token).toBe("NEW");
    expect(calls).toHaveLength(1);
  });
  it("refreshes YouTube's hour-long key with the refresh token, and asks to reconnect when Google says no", async () => {
    const { ctx } = fake([["POST", "https://oauth2.googleapis.com/token", { error: "invalid_grant", error_description: "Token has been expired or revoked." }, 400]]);
    const e = await refresh(ctx, "youtube", cfg, { access_token: "A", refresh_token: "R", expires_at: "2026-11-24T17:00:00Z" }).catch(x => x);
    expect(e).toMatchObject({ reconnect: true, message: "Google: Token has been expired or revoked." });
  });
  it("keeps X's new refresh token", async () => {
    const { ctx } = fake([["POST", "https://api.x.com/2/oauth2/token", { access_token: "A2", refresh_token: "R2", expires_in: 7200 }]]);
    const r = await refresh(ctx, "x", cfg, { access_token: "A", refresh_token: "R", expires_at: "2026-11-24T17:59:00Z" });
    expect(r?.token).toMatchObject({ access_token: "A2", refresh_token: "R2" });
  });
  it("reads likes and views", async () => {
    const { ctx } = fake([
      ["GET", "https://graph.facebook.com/v23.0/123_4", { reactions: { summary: { total_count: 12 } }, comments: { summary: { total_count: 3 } }, shares: { count: 2 } }],
      ["GET", "https://www.googleapis.com/youtube/v3/videos", { items: [{ statistics: { viewCount: "250", likeCount: "20", commentCount: "4" } }] }]
    ]);
    expect(await stats(ctx, "facebook", cfg, "123_4", tok)).toEqual({ likes: 12, comments: 3, shares: 2 });
    expect(await stats(ctx, "youtube", cfg, "vid", tok)).toEqual({ views: 250, likes: 20, comments: 4 });
    expect(await stats(ctx, "x", cfg, "t1", tok)).toBeNull();
  });
});

// The Reavers social media manager: connects the club's accounts, posts on schedule, and reads likes and views.
//
//   1. Every 5 minutes pg_cron calls it (header x-reavers-cron): it posts whatever is due and refreshes recent numbers.
//   2. The app (Growth → Social media), signed in, with the "social" page:
//        { action: "status" }                           which platforms have their developer app keys here (view)
//        { action: "connect", platform, return_to }     a sign-in link for Facebook, Instagram, YouTube, TikTok or X (use)
//        { action: "connect_form", platform, fields }   Bluesky (handle + app password) or Discord (webhook address) (use)
//        { action: "run" }                              post what's due now, e.g. right after "Post now" (use)
//        { action: "retry", target_id }                 try one failed account again (use)
//   3. The platforms send people back here after they sign in (GET ?code=…&state=…). This function's own address is the
//      one redirect address to register in every developer app.
//
// Keys are kept in reavers_app_social_tokens, which only the service role can read. Migration 20261124000000.
// Setup: docs/social-media.md. Deploy with JWT verification off (pg_cron and the platforms' sign-in redirects carry no
// Supabase sign-in); every app call is checked below.
//
// Secrets: SOCIAL_REDIRECT_URI (this function's public address), META_APP_ID + META_APP_SECRET, INSTAGRAM_APP_ID +
// INSTAGRAM_APP_SECRET, GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET, TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET, X_CLIENT_ID +
// X_CLIENT_SECRET, META_GRAPH_VERSION (optional, default v23.0), REAVERS_CRON_SECRET, APP_URL (optional).
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { isPlatform, MAX_ATTEMPTS, PLATFORM, problemsFor, retryDelayMinutes, type Platform, type PostDraft } from "../_shared/social.ts";
import {
  authorizeUrl, configured, connectWithForm, exchange, missingKeys, pkceChallenge, PlatformError, publish, randomToken, refresh, stats,
  type Config, type ConnectedAccount, type Ctx, type Token
} from "../_shared/socialPlatforms.ts";

const env = (k: string) => Deno.env.get(k) ?? "";
const APP_URL = (env("APP_URL") || "https://app.reddeerreavers.com/").replace(/#.*$/, "");
const cfg: Config = {
  redirectUri: env("SOCIAL_REDIRECT_URI") || "https://api-home.buhurtoshome.app/functions/v1/reavers-social",
  graphVersion: env("META_GRAPH_VERSION") || "v23.0",
  metaAppId: env("META_APP_ID"), metaAppSecret: env("META_APP_SECRET"),
  instagramAppId: env("INSTAGRAM_APP_ID"), instagramAppSecret: env("INSTAGRAM_APP_SECRET"),
  googleClientId: env("GOOGLE_CLIENT_ID"), googleClientSecret: env("GOOGLE_CLIENT_SECRET"),
  tiktokClientKey: env("TIKTOK_CLIENT_KEY"), tiktokClientSecret: env("TIKTOK_CLIENT_SECRET"),
  xClientId: env("X_CLIENT_ID"), xClientSecret: env("X_CLIENT_SECRET")
};
const ctx: Ctx = { fetch: (i, init) => fetch(i, init), wait: ms => new Promise(r => setTimeout(r, ms)), now: () => Date.now() };
const service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const redirect = (to: string) => new Response(null, { status: 303, headers: { Location: to } });

/** Only send people back to the app itself (or a local copy while developing). */
const safeReturn = (u: unknown) =>
  typeof u === "string" && (u.startsWith(APP_URL) || /^https:\/\/(app\.)?reddeerreavers\.com\//.test(u) || /^http:\/\/localhost(:\d+)?\//.test(u)) ? u : `${APP_URL}#/social`;
const withParams = (base: string, params: Record<string, string>) => `${base}${base.includes("?") ? "&" : "?"}${new URLSearchParams(params)}`;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") return await callback(new URL(req.url));
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    if (req.headers.get("x-reavers-cron") !== null) {
      const secret = env("REAVERS_CRON_SECRET");
      if (!secret || req.headers.get("x-reavers-cron") !== secret) return json({ error: "Forbidden" }, 403);
      return json(await run());
    }

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Sign in first" }, 401);
    const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const [{ data: user }, { data: pages }] = await Promise.all([asUser.auth.getUser(), asUser.rpc("reavers_app_my_pages")]);
    const level = Number((pages as Record<string, number> | null)?.social ?? 0);
    if (!user?.user || level < 1) return json({ error: "You don't have the Social media page" }, 403);
    const body = await req.json().catch(() => ({}));
    const platform: Platform | null = isPlatform(body.platform) ? body.platform : null;

    if (body.action === "status") {
      return json({ platforms: configured(cfg), redirectUri: cfg.redirectUri, schedule: Boolean(env("REAVERS_CRON_SECRET")) });
    }
    if (level < 2) return json({ error: "You can look at the Social media page but not change it" }, 403);

    if (body.action === "connect") {
      if (!platform || PLATFORM[platform].connect !== "oauth") return json({ error: "Pick a platform" }, 400);
      const p = platform;
      if (!configured(cfg)[p]) return json({ error: `${PLATFORM[p].label} isn't set up on the server yet (${missingKeys(p)}). See docs/social-media.md.` }, 400);
      const state = randomToken(24);
      const verifier = p === "x" ? randomToken(48) : null;
      await service.from("reavers_app_social_oauth").delete().lt("created_at", new Date(Date.now() - 3600e3).toISOString());
      const { error } = await service.from("reavers_app_social_oauth").insert({ state, platform: p, user_id: user.user.id, verifier, return_to: safeReturn(body.return_to) });
      if (error) throw error;
      return json({ url: authorizeUrl(p, cfg, state, verifier ? await pkceChallenge(verifier) : undefined) });
    }
    if (body.action === "connect_form") {
      if (!platform || PLATFORM[platform].connect !== "form") return json({ error: "Pick a platform" }, 400);
      try {
        const accounts = await connectWithForm(ctx, platform, body.fields || {});
        await saveAccounts(accounts, user.user.id);
        return json({ connected: accounts.map(a => a.name) });
      } catch (e) {
        return json({ error: (e as Error).message }, 400);
      }
    }
    if (body.action === "run") return json(await run());
    if (body.action === "retry" && typeof body.target_id === "string") {
      const { data, error } = await service.from("reavers_app_social_targets").update({ status: "pending", error: null, next_try_at: null })
        .eq("id", body.target_id).in("status", ["failed", "skipped"]).select("id");
      if (error) throw error;
      if (!data?.length) return json({ error: "That one isn't waiting for a retry" }, 400);
      return json(await run());
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

// ------------------------------------------------------------------ coming back from a platform's sign-in

async function callback(url: URL): Promise<Response> {
  const state = url.searchParams.get("state");
  if (!state) return json({ error: "Sign in first" }, 401);
  const { data: row } = await service.from("reavers_app_social_oauth").delete().eq("state", state).select("*").maybeSingle();
  if (!row) return redirect(withParams(`${APP_URL}#/social`, { social_error: "That sign-in link was already used or ran out. Press Connect again." }));
  const back = row.return_to as string;
  if (Date.now() - Date.parse(row.created_at) > 15 * 60e3) return redirect(withParams(back, { social_error: "The sign-in took too long. Press Connect again." }));
  const denied = url.searchParams.get("error_description") || url.searchParams.get("error_message") || url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (denied || !code) return redirect(withParams(back, { social_error: `${PLATFORM[row.platform as Platform].label} sign-in was cancelled${denied ? `: ${denied}` : ""}.` }));
  try {
    const accounts = await exchange(ctx, row.platform as Platform, cfg, code, row.verifier);
    await saveAccounts(accounts, row.user_id);
    return redirect(withParams(back, { social_connected: accounts.map(a => a.name).join(", ") }));
  } catch (e) {
    console.error(e);
    return redirect(withParams(back, { social_error: (e as Error).message }));
  }
}

async function saveAccounts(accounts: ConnectedAccount[], userId: string) {
  for (const a of accounts) {
    const { data, error } = await service.from("reavers_app_social_accounts").upsert({
      platform: a.platform, external_id: a.external_id, name: a.name, handle: a.handle ?? null, avatar_url: a.avatar_url ?? null,
      profile_url: a.profile_url ?? null, status: "connected", last_error: null, connected_by: userId, connected_at: new Date().toISOString(),
      token_expires_at: a.token_expires_at ?? null
    }, { onConflict: "platform,external_id" }).select("id").single();
    if (error) throw error;
    await saveToken(data.id, a.token);
  }
}

async function saveToken(accountId: string, t: Token) {
  const { error } = await service.from("reavers_app_social_tokens").upsert({
    account_id: accountId, access_token: t.access_token, refresh_token: t.refresh_token ?? null, expires_at: t.expires_at ?? null,
    extra: t.extra ?? {}, updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

type AccountRow = { id: string; platform: Platform; external_id: string; name: string; handle: string | null; profile_url: string | null; status: string };
type TokenRow = Token & { account_id: string };

/** The account's keys, refreshed first if they're about to run out. */
async function freshToken(a: AccountRow, t: TokenRow): Promise<Token> {
  const r = await refresh(ctx, a.platform, cfg, t);
  if (!r) return t;
  await saveToken(a.id, r.token);
  if (r.token_expires_at !== undefined) await service.from("reavers_app_social_accounts").update({ token_expires_at: r.token_expires_at }).eq("id", a.id);
  return r.token;
}

async function needsReconnect(a: AccountRow, why: string) {
  await service.from("reavers_app_social_accounts").update({ status: "needs_reconnect", last_error: why }).eq("id", a.id);
}

// ------------------------------------------------------------------ posting what's due

async function run() {
  const now = new Date();
  const { data: claimed, error } = await service.rpc("reavers_app_social_claim", { p_now: now.toISOString(), p_limit: 6 });
  if (error) throw error;
  const targets = (claimed || []) as { id: string; post_id: string; account_id: string; platform: Platform; attempts: number }[];
  let published = 0, failed = 0;

  if (targets.length) {
    const [posts, accounts, tokens] = await Promise.all([
      service.from("reavers_app_social_posts").select("*").in("id", [...new Set(targets.map(t => t.post_id))]),
      service.from("reavers_app_social_accounts").select("*").in("id", [...new Set(targets.map(t => t.account_id))]),
      service.from("reavers_app_social_tokens").select("*").in("account_id", [...new Set(targets.map(t => t.account_id))])
    ]);
    for (const r of [posts, accounts, tokens]) if (r.error) throw r.error;
    for (const t of targets) {
      const post = posts.data!.find(p => p.id === t.post_id) as PostDraft & { id: string };
      const account = accounts.data!.find(a => a.id === t.account_id) as AccountRow | undefined;
      const token = tokens.data!.find(k => k.account_id === t.account_id) as TokenRow | undefined;
      const fail = async (message: string, retry: boolean) => {
        failed++;
        await service.from("reavers_app_social_targets").update({
          status: "failed", error: message.slice(0, 500),
          attempts: retry ? t.attempts : MAX_ATTEMPTS,
          next_try_at: retry ? new Date(now.getTime() + retryDelayMinutes(t.attempts) * 60e3).toISOString() : null
        }).eq("id", t.id);
      };
      if (!account || !token) { await fail("That account was disconnected.", false); continue; }
      if (account.status === "needs_reconnect") { await fail(`${account.name} needs connecting again (Accounts, above).`, false); continue; }
      const problems = problemsFor(post, account.platform);
      if (problems.length) { await fail(problems.join(" "), false); continue; }
      try {
        const done = await publish(ctx, account.platform, cfg, post, account, await freshToken(account, token));
        published++;
        await service.from("reavers_app_social_targets").update({
          status: "published", external_id: done.external_id, url: done.url, note: done.note ?? null, error: null, next_try_at: null,
          published_at: new Date().toISOString()
        }).eq("id", t.id);
      } catch (e) {
        const pe = e instanceof PlatformError ? e : new PlatformError((e as Error).message);
        console.error(account.platform, pe.message);
        if (pe.reconnect) await needsReconnect(account, pe.message);
        await fail(pe.reconnect ? `${pe.message} Connect ${account.name} again, then press Try again.` : pe.message, pe.retry && !pe.reconnect);
      }
    }
  }

  return { published, failed, stats: await refreshStats(), renewed: await renewKeys() };
}

/** Likes, comments, shares and views for posts from the last 30 days, at most every 3 hours each. */
async function refreshStats(): Promise<number> {
  const { data } = await service.from("reavers_app_social_targets").select("id, account_id, platform, external_id, stats_at")
    .eq("status", "published").in("platform", ["facebook", "instagram", "youtube", "bluesky"]).not("external_id", "is", null)
    .gt("published_at", new Date(Date.now() - 30 * 86400e3).toISOString())
    .or(`stats_at.is.null,stats_at.lt.${new Date(Date.now() - 3 * 3600e3).toISOString()}`).limit(15);
  if (!data?.length) return 0;
  const ids = [...new Set(data.map(d => d.account_id).filter(Boolean))];
  const [{ data: accounts }, { data: tokens }] = await Promise.all([
    service.from("reavers_app_social_accounts").select("*").in("id", ids).eq("status", "connected"),
    service.from("reavers_app_social_tokens").select("*").in("account_id", ids)
  ]);
  let n = 0;
  for (const t of data) {
    const a = accounts?.find(x => x.id === t.account_id) as AccountRow | undefined;
    const k = tokens?.find(x => x.account_id === t.account_id) as TokenRow | undefined;
    if (!a || !k) continue;
    try {
      const s = await stats(ctx, a.platform, cfg, t.external_id!, await freshToken(a, k));
      await service.from("reavers_app_social_targets").update({ stats: s, stats_at: new Date().toISOString() }).eq("id", t.id);
      n++;
    } catch (e) {
      // Numbers are nice to have: note when the keys stopped working, otherwise try again next time.
      if (e instanceof PlatformError && e.reconnect) await needsReconnect(a, e.message);
      await service.from("reavers_app_social_targets").update({ stats_at: new Date().toISOString() }).eq("id", t.id);
    }
  }
  return n;
}

/** Instagram keys run out after 60 days unless renewed; renew them well before, even when nothing is being posted. */
async function renewKeys(): Promise<number> {
  const { data: accounts } = await service.from("reavers_app_social_accounts").select("*").eq("platform", "instagram").eq("status", "connected")
    .lt("token_expires_at", new Date(Date.now() + 15 * 86400e3).toISOString());
  let n = 0;
  for (const a of (accounts || []) as AccountRow[]) {
    const { data: k } = await service.from("reavers_app_social_tokens").select("*").eq("account_id", a.id).maybeSingle();
    if (!k) continue;
    try { await freshToken(a, k as TokenRow); n++; } catch (e) { if (e instanceof PlatformError && e.reconnect) await needsReconnect(a, e.message); }
  }
  return n;
}

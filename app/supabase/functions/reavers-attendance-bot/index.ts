// The Reavers attendance bot. One function, three callers:
//
//   1. The app (a captain or executive, signed in): { action: "ask", person_id } messages that member on Discord, asks why
//      they haven't been around, and gives them a button to answer.
//   2. Discord (Interactions Endpoint URL): the member presses the button, types their answer in a pop-up, and it's saved on
//      their tracker record and posted to the leadership channel.
//   3. A daily schedule (pg_cron, header x-reavers-cron): posts new 3-month no-shows and removal timers that ran out to the
//      leadership channel.
//
// It never kicks anyone from Discord or BuhurtOS. Setup: docs/attendance-discord-bot.md.
// Deploy with JWT verification off (Discord can't send a Supabase token); each caller is checked below instead.
//
// Secrets: DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_LEADERSHIP_WEBHOOK, REAVERS_CRON_SECRET (APP_URL optional).
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const env = (k: string) => Deno.env.get(k) ?? "";
const DISCORD = "https://discord.com/api/v10";
const APP_URL = env("APP_URL") || "https://app.reddeerreavers.com/#/attendance";
const service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Target = { id: string; name: string; status: string; removal_deadline: string | null; discord_id: string | null };

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    if (req.headers.get("x-signature-ed25519")) return await interaction(req);
    if (req.headers.get("x-reavers-cron") !== null) return await daily(req);
    return await ask(req);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

// ------------------------------------------------------------------ 1. the app asks

async function ask(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Sign in first" }, 401);
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: role, error: roleError } = await asUser.rpc("reavers_app_my_role");
  if (roleError || (role !== "exec" && role !== "finance")) return json({ error: "Only a captain or the executive can do this" }, 403);

  const body = await req.json().catch(() => ({}));
  if (body.action !== "ask" || typeof body.person_id !== "string") return json({ error: "Unknown request" }, 400);
  const { data: target, error } = await service.rpc("reavers_app_bot_target", { p_person: body.person_id });
  if (error) throw error;
  const t = target as Target | null;
  if (!t) return json({ error: "Person not found" }, 404);
  if (!t.discord_id) {
    const message = "No Discord account is linked to them. Add their Discord user ID on their record, or have them sign in to BuhurtOS with Discord.";
    await service.rpc("reavers_app_bot_dm_result", { p_person: t.id, p_error: message });
    return json({ error: message }, 400);
  }

  const first = t.name.split(/\s+/)[0];
  const deadline = t.status === "removal" && t.removal_deadline ? longDate(t.removal_deadline) : null;
  const content = [
    `Hey ${first}, this is the Red Deer Reavers bot. We haven't seen you at practice, tournaments, events or fundraisers in a while, and we wanted to check in.`,
    deadline
      ? `Under the club's 3-month attendance policy your spot on the team is up for review. If we don't hear from you by **${deadline}**, the captains may take you off the roster.`
      : "",
    "Everything ok? Tap the button below to tell the captains what's going on. Injuries, work, school and life all happen, and a quick answer is all we need."
  ].filter(Boolean).join("\n\n");

  const sent = await sendDm(t.discord_id, {
    content,
    allowed_mentions: { parse: [] },
    components: [{ type: 1, components: [{ type: 2, style: 1, label: "Tell the captains why", custom_id: `reason:${t.id}` }] }]
  });
  await service.rpc("reavers_app_bot_dm_result", { p_person: t.id, p_error: sent.ok ? null : sent.error });
  if (!sent.ok) return json({ error: sent.error }, 502);
  await leadership(`📨 Asked **${clean(t.name)}** on Discord why they haven't been around${deadline ? ` (removal timer runs until ${deadline})` : ""}.`);
  return json({ message: `Sent ${t.name} a message on Discord.` });
}

async function sendDm(discordId: string, message: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  const headers = { Authorization: `Bot ${env("DISCORD_BOT_TOKEN")}`, "Content-Type": "application/json" };
  const channel = await fetch(`${DISCORD}/users/@me/channels`, { method: "POST", headers, body: JSON.stringify({ recipient_id: discordId }) });
  if (!channel.ok) return { ok: false, error: `Discord wouldn't open a message to them (${channel.status} ${await channel.text()})` };
  const { id } = await channel.json();
  const res = await fetch(`${DISCORD}/channels/${id}/messages`, { method: "POST", headers, body: JSON.stringify(message) });
  if (res.ok) return { ok: true };
  const detail = await res.json().catch(() => ({}));
  if (detail?.code === 50007) return { ok: false, error: "They don't accept messages from the bot: they may have DMs from server members turned off, or aren't in the Reavers Discord." };
  return { ok: false, error: `Discord refused the message (${res.status} ${detail?.message ?? ""})` };
}

// ------------------------------------------------------------------ 2. Discord: the member answers

async function interaction(req: Request) {
  const raw = await req.text();
  if (!(await verifyDiscord(req, raw))) return new Response("Bad signature", { status: 401 });
  const i = JSON.parse(raw);
  if (i.type === 1) return json({ type: 1 }); // Discord checking the endpoint

  const user = i.user?.id ?? i.member?.user?.id;
  const custom: string = i.data?.custom_id ?? "";
  if (i.type === 3 && custom.startsWith("reason:")) {
    return json({
      type: 9,
      data: {
        custom_id: `reason_modal:${custom.slice(7)}`,
        title: "Talk to the Reavers captains",
        components: [{ type: 1, components: [{ type: 4, custom_id: "why", style: 2, label: "What's been going on?", min_length: 2, max_length: 1500, required: true, placeholder: "e.g. Hurt my knee, back in January" }] }]
      }
    });
  }
  if (i.type === 5 && custom.startsWith("reason_modal:")) {
    const text = String(i.data?.components?.[0]?.components?.[0]?.value ?? "").trim();
    const { data, error } = await service.rpc("reavers_app_bot_reply", { p_person: custom.slice(13), p_discord_id: user, p_text: text });
    if (error) return json({ type: 4, data: { content: "Sorry, that didn't save. Please message a captain directly.", flags: 64 } });
    const r = data as { name: string; removal_deadline: string | null };
    await leadership(`💬 **${clean(r.name)}** answered the attendance bot:\n> ${clean(text).replace(/\n/g, "\n> ")}\n${APP_URL}`);
    return json({ type: 4, data: { content: "Thanks! The captains have your answer and will be in touch if they need anything else. 🛡️", flags: 64 } });
  }
  return json({ type: 4, data: { content: "This button has expired.", flags: 64 } });
}

const hex = (s: string) => new Uint8Array((s.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16)));
async function verifyDiscord(req: Request, body: string) {
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  try {
    const key = await crypto.subtle.importKey("raw", hex(env("DISCORD_PUBLIC_KEY")), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", key, hex(signature), new TextEncoder().encode(timestamp + body));
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ 3. the daily check

async function daily(req: Request) {
  const secret = env("REAVERS_CRON_SECRET");
  if (!secret || req.headers.get("x-reavers-cron") !== secret) return json({ error: "Forbidden" }, 403);
  // Admins can turn this post off on Team → Reminders (until that update is applied the table isn't there, and it stays on).
  const settings = await service.from("reavers_app_reminder_settings").select("noshow_enabled").eq("id", 1).maybeSingle();
  if (!settings.error && settings.data && settings.data.noshow_enabled === false) return json({ no_shows: 0, expired: 0, off: true });
  const { data, error } = await service.rpc("reavers_app_bot_daily");
  if (error) throw error;
  const { no_shows, expired } = data as {
    no_shows: { name: string; last_seen: string | null; since: string; last_contact_on: string | null }[];
    expired: { name: string; removal_deadline: string; reply_text: string | null }[];
  };
  const lines: string[] = [];
  if (no_shows.length) {
    lines.push(`🚩 **${no_shows.length} ${no_shows.length === 1 ? "member hasn't" : "members haven't"} shown up in over 3 months**`);
    for (const p of no_shows) {
      lines.push(`• ${clean(p.name)}: ${p.last_seen ? `last seen ${longDate(p.last_seen)}` : `never marked present (started ${longDate(p.since)})`}${p.last_contact_on ? `, last heard from ${longDate(p.last_contact_on)}` : ""}`);
    }
    lines.push("A captain or executive can start a removal timer in the app, and the bot will ask them why.");
  }
  if (expired.length) {
    lines.push(`⏰ **Removal timer ran out**`);
    for (const p of expired) lines.push(`• ${clean(p.name)}${p.reply_text ? ` (they answered: "${clean(p.reply_text).slice(0, 200)}")` : " (no answer)"}`);
    lines.push("Keep them or mark them removed in the app.");
  }
  if (lines.length) await leadership(`${lines.join("\n")}\n${APP_URL}`);
  return json({ no_shows: no_shows.length, expired: expired.length });
}

// ------------------------------------------------------------------ helpers

async function leadership(content: string) {
  const url = env("DISCORD_LEADERSHIP_WEBHOOK");
  if (!url) return;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.slice(0, 1990), allowed_mentions: { parse: [] } }) });
  if (!res.ok) console.error("leadership webhook", res.status, await res.text());
}

const clean = (s: string) => s.replace(/([*_`~|>\\])/g, "\\$1").replace(/@/g, "@\u200b");
const longDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

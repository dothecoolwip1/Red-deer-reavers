// The Reavers reminders: monthly dues, practices, calendar events and the 3-month attendance warning, by Discord and/or email.
//
//   1. An hourly schedule (pg_cron, header x-reavers-cron) sends whatever is due right now.
//   2. The app: an admin presses "Send what's due now" ({ action: "run" }), or the Reminders page asks which keys are set
//      up ({ action: "status" }, anyone on the executive).
//
// What is due, and what was already sent, comes from reavers_app_reminders_due() (migration 20261112000000); each send is
// written back with reavers_app_reminders_record(), so nothing goes out twice. Settings: app → Team → Reminders.
// Setup: docs/reminders.md. Deploy with JWT verification off (pg_cron sends the cron secret, not a sign-in); the app's
// calls are checked below.
//
// Secrets: DISCORD_BOT_TOKEN (DMs; the attendance bot's), DISCORD_MEMBERS_WEBHOOK (the members' channel),
// RESEND_API_KEY + REMINDER_EMAIL_FROM (email; REMINDER_EMAIL_REPLY_TO optional), REAVERS_CRON_SECRET, APP_URL and SITE_URL optional.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { duesMessage, eventMessage, practiceMessage, warningMessage, type Due, type DuesDue, type EventDue, type PracticeDue, type WarningDue } from "../_shared/reminders.ts";

const env = (k: string) => Deno.env.get(k) ?? "";
const DISCORD = "https://discord.com/api/v10";
const APP_URL = (env("APP_URL") || "https://app.reddeerreavers.com/").replace(/#.*$/, "");
const SITE_URL = env("SITE_URL") || "https://reddeerreavers.com/";
const service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Log = { kind: string; ref: string; via: "discord" | "email"; recipient: string; summary: string; status: "sent" | "skipped" | "failed"; error?: string | null };

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    if (req.headers.get("x-reavers-cron") !== null) {
      const secret = env("REAVERS_CRON_SECRET");
      if (!secret || req.headers.get("x-reavers-cron") !== secret) return json({ error: "Forbidden" }, 403);
      return json(await run());
    }
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Sign in first" }, 401);
    const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: role } = await asUser.rpc("reavers_app_my_role");
    const body = await req.json().catch(() => ({}));
    if (body.action === "status" && (role === "exec" || role === "finance")) {
      return json({ discordDm: Boolean(env("DISCORD_BOT_TOKEN")), discordChannel: Boolean(env("DISCORD_MEMBERS_WEBHOOK")), email: Boolean(env("RESEND_API_KEY") && env("REMINDER_EMAIL_FROM")), schedule: Boolean(env("REAVERS_CRON_SECRET")) });
    }
    if (body.action === "run" && role === "finance") return json(await run());
    return json({ error: role === "exec" || role === "finance" ? "Only an admin can do this" : "Only the executive can do this" }, 403);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function run() {
  const { data, error } = await service.rpc("reavers_app_reminders_due", {});
  if (error) throw error;
  const due = data as Due;
  if (!due.settings) return { sent: 0, skipped: 0, failed: 0 };
  const s = due.settings;
  const logs: Log[] = [];
  const links = { pay: `${APP_URL}#/pay`, training: `${SITE_URL}training.html`, events: `${SITE_URL}events.html` };

  for (const d of due.dues as DuesDue[]) {
    const m = duesMessage(d, links);
    const base = { kind: d.kind, ref: d.ref, recipient: d.name, summary: m.subject };
    if (s.dues_via !== "email") logs.push({ ...base, via: "discord", ...(await dm(d.discord_id, m.discord, { label: "Pay dues", url: links.pay })) });
    if (s.dues_via !== "discord") logs.push({ ...base, via: "email", ...(await email(d.email ? [d.email] : [], m.subject, m.text)) });
  }
  const everyone = (due.members || []).map(m => m.email).filter((e): e is string => Boolean(e));
  for (const p of due.practices as PracticeDue[]) {
    const m = practiceMessage(p, links);
    const base = { kind: "practice", ref: p.ref, summary: m.subject };
    if (s.practice_via !== "email") logs.push({ ...base, via: "discord", recipient: "members channel", ...(await channel(m.discord)) });
    if (s.practice_via !== "discord") logs.push({ ...base, via: "email", recipient: `${everyone.length} members`, ...(await email(everyone, m.subject, m.text)) });
  }
  for (const e of due.events as EventDue[]) {
    const m = eventMessage(e, due.today, links);
    const base = { kind: "event", ref: e.ref, summary: m.subject };
    if (s.events_via !== "email") logs.push({ ...base, via: "discord", recipient: "members channel", ...(await channel(m.discord)) });
    if (s.events_via !== "discord") logs.push({ ...base, via: "email", recipient: `${everyone.length} members`, ...(await email(everyone, m.subject, m.text)) });
  }
  for (const w of due.warnings as WarningDue[]) {
    const m = warningMessage(w, links);
    logs.push({ kind: "noshow_warning", ref: w.ref, via: "discord", recipient: w.name, summary: m.subject, ...(await dm(w.discord_id, m.discord, { label: "Practice times", url: links.training })) });
  }

  if (logs.length) {
    const { error: e } = await service.rpc("reavers_app_reminders_record", { p_rows: logs });
    if (e) throw e;
  }
  const count = (st: Log["status"]) => logs.filter(l => l.status === st).length;
  return { sent: count("sent"), skipped: count("skipped"), failed: count("failed") };
}

// ------------------------------------------------------------------ sending

type Result = { status: Log["status"]; error?: string };

async function dm(discordId: string | null, content: string, button?: { label: string; url: string }): Promise<Result> {
  if (!discordId) return { status: "skipped", error: "No Discord account linked" };
  if (!env("DISCORD_BOT_TOKEN")) return { status: "skipped", error: "The Discord bot isn't set up" };
  const headers = { Authorization: `Bot ${env("DISCORD_BOT_TOKEN")}`, "Content-Type": "application/json" };
  const ch = await fetch(`${DISCORD}/users/@me/channels`, { method: "POST", headers, body: JSON.stringify({ recipient_id: discordId }) });
  if (!ch.ok) return { status: "failed", error: `Discord wouldn't open a message (${ch.status})` };
  const { id } = await ch.json();
  const res = await fetch(`${DISCORD}/channels/${id}/messages`, {
    method: "POST", headers,
    body: JSON.stringify({ content, allowed_mentions: { parse: [] }, components: button ? [{ type: 1, components: [{ type: 2, style: 5, ...button }] }] : [] })
  });
  if (res.ok) return { status: "sent" };
  const detail = await res.json().catch(() => ({}));
  // They have DMs from server members off, or left the server: trying again won't help.
  if (detail?.code === 50007) return { status: "skipped", error: "They don't accept messages from the bot" };
  return { status: "failed", error: `Discord refused the message (${res.status} ${detail?.message ?? ""})` };
}

async function channel(content: string): Promise<Result> {
  const url = env("DISCORD_MEMBERS_WEBHOOK");
  if (!url) return { status: "skipped", error: "No members' channel webhook set up" };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.slice(0, 1990), allowed_mentions: { parse: [] } }) });
  return res.ok ? { status: "sent" } : { status: "failed", error: `Discord webhook answered ${res.status}` };
}

/** One email per person (nobody sees anyone else's address), sent in batches of 100 through Resend. */
async function email(to: string[], subject: string, text: string): Promise<Result> {
  if (!to.length) return { status: "skipped", error: "No email address" };
  if (!env("RESEND_API_KEY") || !env("REMINDER_EMAIL_FROM")) return { status: "skipped", error: "Email isn't set up" };
  for (let i = 0; i < to.length; i += 100) {
    const batch = to.slice(i, i + 100).map(addr => ({
      from: env("REMINDER_EMAIL_FROM"), to: [addr], subject, text,
      ...(env("REMINDER_EMAIL_REPLY_TO") ? { reply_to: env("REMINDER_EMAIL_REPLY_TO") } : {})
    }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify(batch)
    });
    if (!res.ok) return { status: "failed", error: `Email service answered ${res.status} ${(await res.text()).slice(0, 200)}` };
  }
  return { status: "sent" };
}

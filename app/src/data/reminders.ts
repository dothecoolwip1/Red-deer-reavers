import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type ReminderSettings } from "../lib/reminders";

// Automatic reminders (dues, practices, events, the attendance warning). Settings and history live in
// reavers_app_reminder_settings and reavers_app_reminder_log (migration 20261112000000); the reavers-reminders function sends.

export type ReminderKind = "dues" | "dues_followup" | "practice" | "event" | "noshow_warning";
export type ReminderLog = {
  id: string; kind: ReminderKind; ref: string; via: "discord" | "email"; recipient: string; summary: string;
  status: "sent" | "skipped" | "failed"; error: string | null; sent_at: string;
};
/** Which keys the server has. null = the function isn't deployed yet. */
export type ReminderStatus = { discordDm: boolean; discordChannel: boolean; email: boolean; schedule: boolean } | null;
export type Editable = Omit<ReminderSettings, "updated_at">;
export const EDITABLE = Object.keys(DEFAULT_SETTINGS) as (keyof Editable)[];

export interface RemindersApi {
  /** null until the update is applied to the database. */
  settings(): Promise<ReminderSettings | null>;
  save(patch: Partial<Editable>): Promise<void>;
  log(): Promise<ReminderLog[]>;
  status(): Promise<ReminderStatus>;
  /** Sends whatever is due right now (admins). */
  runNow(): Promise<string>;
}

const MISSING = new Set(["PGRST202", "PGRST205", "42P01", "42883"]);
const fail = (error: { message: string; code?: string } | null) => {
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
};

async function invoke(sb: SupabaseClient, body: Record<string, unknown>) {
  const { data, error } = await sb.functions.invoke("reavers-reminders", { body });
  if (!error) return data as Record<string, unknown>;
  let message = error.message;
  try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) message = b.error; } catch { /* keep the generic message */ }
  throw new Error(message);
}

export function liveReminders(sb: () => SupabaseClient): RemindersApi {
  return {
    async settings() {
      const { data, error } = await sb().from("reavers_app_reminder_settings").select("*").eq("id", 1).maybeSingle();
      if (error && MISSING.has(error.code || "")) return null;
      fail(error);
      return data ? { ...DEFAULT_SETTINGS, ...data } : null;
    },
    async save(patch) {
      const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => (EDITABLE as string[]).includes(k)));
      const { data, error } = await sb().from("reavers_app_reminder_settings").update(clean).eq("id", 1).select("id");
      fail(error);
      if (!data?.length) throw new Error("Only an admin can change the reminders.");
    },
    async log() {
      const { data, error } = await sb().from("reavers_app_reminder_log").select("*").order("sent_at", { ascending: false }).limit(200);
      if (error && MISSING.has(error.code || "")) return [];
      fail(error);
      return (data || []) as ReminderLog[];
    },
    async status() {
      try { return (await invoke(sb(), { action: "status" })) as ReminderStatus; } catch { return null; }
    },
    async runNow() {
      try {
        const r = await invoke(sb(), { action: "run" }) as { sent: number; skipped: number; failed: number };
        if (!r.sent && !r.skipped && !r.failed) return "Nothing is due right now.";
        return [`Sent ${r.sent}`, r.skipped && `${r.skipped} skipped`, r.failed && `${r.failed} failed`].filter(Boolean).join(", ") + ". See the history below.";
      } catch (e) {
        const m = (e as Error).message;
        throw new Error(/Failed to send|NetworkError|Load failed|404/i.test(m) ? "The reminders function isn't set up on the server yet, so nothing was sent." : m);
      }
    }
  };
}

// ------------------------------------------------------------------ sample data (demo mode)

const KEY = "reavers-app-reminders-demo-v1";
const ago = (hours: number) => new Date(Date.now() - hours * 3600e3).toISOString();
const monthLabel = new Intl.DateTimeFormat("en-CA", { month: "long" }).format(new Date());

function demoSeed(): { settings: ReminderSettings; log: ReminderLog[] } {
  let n = 0;
  const row = (hours: number, r: Omit<ReminderLog, "id" | "sent_at" | "error" | "ref"> & { error?: string }): ReminderLog =>
    ({ id: `demo-rem-${n++}`, ref: `demo-${n}`, sent_at: ago(hours), error: null, ...r });
  return {
    settings: { ...DEFAULT_SETTINGS, dues_enabled: true, practice_enabled: true, events_enabled: true, noshow_warn_enabled: true, dues_via: "both" },
    log: [
      row(2, { kind: "practice", via: "discord", recipient: "members channel", summary: "Reavers practice Sunday at 5:00 PM", status: "sent" }),
      row(26, { kind: "event", via: "discord", recipient: "members channel", summary: "Coming up in 3 days: Demo at the Westerner (sample)", status: "sent" }),
      row(50, { kind: "noshow_warning", via: "discord", recipient: "Jordan (sample)", summary: "We miss you at Reavers practice", status: "sent" }),
      row(98, { kind: "practice", via: "discord", recipient: "members channel", summary: "Reavers practice Wednesday at 5:30 PM", status: "sent" }),
      row(240, { kind: "dues", via: "discord", recipient: "Drew (sample)", summary: `Reavers dues for ${monthLabel}`, status: "sent" }),
      row(240, { kind: "dues", via: "email", recipient: "Drew (sample)", summary: `Reavers dues for ${monthLabel}`, status: "sent" }),
      row(240, { kind: "dues", via: "discord", recipient: "Casey (sample)", summary: `Reavers dues for ${monthLabel}`, status: "skipped", error: "No Discord account linked" }),
      row(240, { kind: "dues", via: "email", recipient: "Casey (sample)", summary: `Reavers dues for ${monthLabel}`, status: "sent" })
    ]
  };
}

export function demoReminders(): RemindersApi {
  let db: ReturnType<typeof demoSeed>;
  try { db = JSON.parse(localStorage.getItem(KEY) || "null") || demoSeed(); } catch { db = demoSeed(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  return {
    async settings() { return { ...db.settings }; },
    async save(patch) { db.settings = { ...db.settings, ...patch, updated_at: new Date().toISOString() }; save(); },
    async log() { return structuredClone(db.log); },
    async status() { return { discordDm: true, discordChannel: true, email: false, schedule: true }; },
    async runNow() { return "Sample mode: nothing was sent. On the live app this sends whatever is due right now."; }
  };
}
export const DEMO_REMINDERS_KEY = KEY;

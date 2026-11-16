// Reminder wording and timing, shared by the reavers-reminders function and the app (tested from app/src/lib/reminders.test.ts).
// No Deno- or Node-only APIs here: Intl and plain data only.

export type Via = "discord" | "email" | "both";
export type ReminderSettings = {
  send_hour: number;
  dues_enabled: boolean; dues_day: number; dues_followup_days: number; dues_via: Via;
  practice_enabled: boolean; practice_hours_before: number; practice_via: Via;
  events_enabled: boolean; events_days_before: number; events_via: Via;
  noshow_enabled: boolean; noshow_warn_enabled: boolean; noshow_warn_days: number;
  updated_at?: string;
};
export const DEFAULT_SETTINGS: ReminderSettings = {
  send_hour: 9,
  dues_enabled: false, dues_day: 1, dues_followup_days: 7, dues_via: "discord",
  practice_enabled: false, practice_hours_before: 24, practice_via: "discord",
  events_enabled: false, events_days_before: 3, events_via: "discord",
  noshow_enabled: true, noshow_warn_enabled: false, noshow_warn_days: 14
};

type Contact = { name: string; discord_id: string | null; email: string | null };
export type DuesDue = Contact & { kind: "dues" | "dues_followup"; ref: string; key: string; month: string; price_cents: number | null };
export type PracticeDue = { ref: string; day: string; label: string; start_time: string; end_time: string; venue: string | null; fee: string | null };
export type EventDue = {
  ref: string; title: string; event_type: string; day: string; start_time: string | null; end_time: string | null;
  location: string | null; details: string | null; href: string | null;
};
export type WarningDue = { ref: string; person_id: string; name: string; since: string; limit_on: string; discord_id: string | null };
export type Due = {
  settings: ReminderSettings | null; today: string; members: (Contact & { key: string })[];
  dues: DuesDue[]; practices: PracticeDue[]; events: EventDue[]; warnings: WarningDue[];
};
export type Message = { subject: string; discord: string; text: string };
type Links = { pay: string; training: string; events: string };

const TZ = "America/Edmonton";
const noon = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);
export const longDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(noon(iso));
export const monthName = (iso: string) => new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" }).format(noon(iso));
export function clock(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const first = (name: string) => name.trim().split(/\s+/)[0] || "there";
/** Discord markdown and mentions made harmless in names and titles the club typed. */
export const clean = (s: string) => s.replace(/([*_`~|>\\])/g, "\\$1").replace(/@/g, "@\u200b");

/** The UTC instant of a Red Deer wall-clock time ("2026-11-15", "17:00"), daylight time included. */
export function redDeerInstant(day: string, time: string): Date {
  const [y, mo, d] = day.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(guess)).map(p => [p.type, p.value]));
  const shown = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return new Date(guess + (guess - shown));
}
/** Discord shows <t:…> in each reader's own time zone. */
const stamp = (day: string, time: string, style = "F") => `<t:${Math.floor(redDeerInstant(day, time).getTime() / 1000)}:${style}>`;

export function duesMessage(d: DuesDue, links: Links): Message {
  const month = monthName(d.month);
  const amount = d.price_cents ? ` (${money(d.price_cents)})` : "";
  const again = d.kind === "dues_followup";
  const subject = again ? `Second reminder: Reavers dues for ${month}` : `Reavers dues for ${month}`;
  const lines = [
    `Hi ${first(d.name)}, ${again ? "a second friendly reminder" : "a friendly reminder"} from the Red Deer Reavers: your monthly dues for ${month}${amount} aren't marked as paid yet.`,
    `Pay online any time: ${links.pay}`,
    "Cash or e-Transfer to the treasurer works too. If you've already paid, thank you, and the treasurer will tick it off. If money is tight right now, talk to a captain; there's no judgement."
  ];
  const discord = lines.map(l => l.replace(`: ${links.pay}`, " with the button below.")).join("\n\n").replace(first(d.name), clean(first(d.name)));
  return { subject, discord, text: `${lines.join("\n\n")}\n\nRed Deer Reavers` };
}

export function practiceMessage(p: PracticeDue, links: Links): Message {
  const when = `${longDate(p.day)}, ${clock(p.start_time)} to ${clock(p.end_time)}`;
  const where = [p.venue, p.fee].filter(Boolean).join(" · ");
  const subject = `Reavers practice ${longDate(p.day)} at ${clock(p.start_time)}`;
  const discord = [`🛡️ **Practice ${stamp(p.day, p.start_time, "R")}**: ${stamp(p.day, p.start_time)} to ${stamp(p.day, p.end_time, "t")}`, where && clean(where), "Bring water and your kit. Loaner gear is there if you need it."]
    .filter(Boolean).join("\n");
  const text = [`Reavers practice: ${when}.`, where, "Bring water and your kit. Loaner gear is there if you need it.", `Practice times: ${links.training}`, "Red Deer Reavers"]
    .filter(Boolean).join("\n\n");
  return { subject, discord, text };
}

export function eventMessage(e: EventDue, today: string, links: Links): Message {
  const days = Math.round((noon(e.day).getTime() - noon(today).getTime()) / 864e5);
  const soon = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const time = e.start_time ? `${clock(e.start_time)}${e.end_time ? ` to ${clock(e.end_time)}` : ""}` : "";
  const subject = `Coming up ${soon}: ${e.title}`;
  const discord = [
    `📅 **${clean(e.title)}** ${soon}: ${e.start_time ? `${stamp(e.day, e.start_time)}${e.end_time ? ` to ${stamp(e.day, e.end_time, "t")}` : ""}` : longDate(e.day)}`,
    e.location && `📍 ${clean(e.location)}`, e.details && clean(e.details).slice(0, 600), e.href || links.events
  ].filter(Boolean).join("\n");
  const text = [`${e.title}, ${longDate(e.day)}${time ? `, ${time}` : ""}.`, e.location, e.details, e.href || links.events, "Red Deer Reavers"].filter(Boolean).join("\n\n");
  return { subject, discord, text };
}

export function warningMessage(w: WarningDue, links: Links): Message {
  const lines = [
    `Hey ${first(w.name)}, it's the Red Deer Reavers bot. We haven't seen you at practice since ${longDate(w.since)} and we miss you!`,
    `Under the club's 3-month attendance policy the captains check in with anyone who hasn't come out by then, which for you is ${longDate(w.limit_on)}. Come to any practice, tournament, event or fundraiser before that and you're all set.`,
    "If something's keeping you away (injury, work, school, life), just tell a captain and they can mark you as away."
  ];
  return { subject: "We miss you at Reavers practice", discord: lines.join("\n\n").replace(first(w.name), clean(first(w.name))), text: `${lines.join("\n\n")}\n\nPractice times: ${links.training}` };
}

// ------------------------------------------------------------------ for the Reminders page: when the next ones go out

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (day: string, n: number) => { const d = noon(day); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** The next day (from `today`, Red Deer date) the first dues reminder and the follow-up go out. */
export function nextDuesDays(s: Pick<ReminderSettings, "dues_day" | "dues_followup_days">, today: string): { first: string; followup: string | null } {
  const [y, m, d] = today.split("-").map(Number);
  const month = (offset: number) => iso(new Date(Date.UTC(y, m - 1 + offset, 1, 12)));
  const at = (offset: number, day: number) => addDays(month(offset), day - 1);
  const firstDay = d <= s.dues_day ? at(0, s.dues_day) : at(1, s.dues_day);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const follow = s.dues_followup_days > 0 ? s.dues_day + s.dues_followup_days : 0;
  let followup: string | null = null;
  if (follow) followup = d <= follow && follow <= days ? at(0, follow) : follow <= 28 ? at(1, follow) : null;
  return { first: firstDay, followup };
}

/** When the reminder for a weekly practice on `day` goes out (Red Deer wall clock). */
export function practiceReminderAt(day: string, start: string, hoursBefore: number): Date {
  return new Date(redDeerInstant(day, start).getTime() - hoursBefore * 3600e3);
}
/** When the reminder for an event on `day` goes out. */
export const eventReminderAt = (day: string, s: Pick<ReminderSettings, "events_days_before" | "send_hour">) => redDeerInstant(addDays(day, -s.events_days_before), hour(s.send_hour));
export const sendHourLabel = (h: number) => clock(hour(h));

/** Today's date in Red Deer. */
export const redDeerToday = (now: Date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** The next weekly practice whose reminder hasn't gone out yet, and when it will. */
export function nextPractice<P extends { weekday: number; start_time: string; active: boolean }>(practices: P[], now: Date, hoursBefore: number):
  { practice: P; day: string; startsAt: Date; remindAt: Date } | null {
  const today = redDeerToday(now);
  const dow = noon(today).getUTCDay();
  let best: { practice: P; day: string; startsAt: Date; remindAt: Date } | null = null;
  for (const p of practices.filter(x => x.active)) {
    for (const week of [0, 1]) {
      const day = addDays(today, ((p.weekday - dow + 7) % 7) + week * 7);
      const startsAt = redDeerInstant(day, p.start_time);
      const remindAt = practiceReminderAt(day, p.start_time, hoursBefore);
      if (remindAt <= now) continue;
      if (!best || startsAt < best.startsAt) best = { practice: p, day, startsAt, remindAt };
      break;
    }
  }
  return best;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersonStatus } from "../lib/attendance";

// Member attendance (reavers_app_people, reavers_app_gatherings, reavers_app_attendance) and the removal timer.
// Design and rules: supabase/migrations/20261110000000_reavers_app_attendance.sql.

export const GATHERING_KINDS = ["practice", "tournament", "event", "fundraiser"] as const;
export type GatheringKind = (typeof GATHERING_KINDS)[number];

export type PersonStats = {
  total: number; practices: number; tournaments: number; events: number; fundraisers: number; recent: number;
  first_seen: string | null; last_seen: string | null; last_practice: string | null;
};
export type Person = {
  id: string; name: string; user_id: string | null; fighter_id: string | null; membership_id: string | null;
  discord_id: string | null; discord_name: string | null; started_on: string | null; last_contact_on: string | null;
  last_contact_note: string | null; notes: string | null; status: PersonStatus;
  removal_started_at: string | null; removal_deadline: string | null; removal_note: string | null; removed_on: string | null;
  dm_sent_at: string | null; dm_error: string | null; reply_text: string | null; reply_at: string | null; created_at: string;
  stats: PersonStats;
};
/** The fields the executive edits directly; status and the timer go through the functions. */
export type PersonDetails = Partial<Pick<Person,
  "name" | "user_id" | "fighter_id" | "membership_id" | "discord_id" | "discord_name" | "started_on" | "last_contact_on" | "last_contact_note" | "notes">>;
export type Gathering = { id: string; kind: GatheringKind; title: string; date: string; notes: string | null };

export interface AttendanceApi {
  people(): Promise<Person[]>;
  savePerson(id: string | null, details: PersonDetails): Promise<void>;
  removePerson(id: string): Promise<void>;
  gatherings(): Promise<Gathering[]>;
  saveGathering(id: string | null, g: Partial<Gathering>): Promise<Gathering>;
  removeGathering(id: string): Promise<void>;
  present(gatheringId: string): Promise<string[]>;
  setPresent(gatheringId: string, personId: string, present: boolean): Promise<void>;
  startRemoval(id: string, days: number, note: string): Promise<void>;
  stopRemoval(id: string, note: string): Promise<void>;
  markRemoved(id: string): Promise<void>;
  setAway(id: string, away: boolean): Promise<void>;
  /** Has the Discord bot message them and ask why they haven't been around. */
  askOnDiscord(id: string): Promise<string>;
}

const EMPTY_STATS: PersonStats = { total: 0, practices: 0, tournaments: 0, events: 0, fundraisers: 0, recent: 0, first_seen: null, last_seen: null, last_practice: null };

function check<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
  return r.data;
}

export function liveAttendance(sb: () => SupabaseClient): AttendanceApi {
  const rpc = async (fn: string, args: Record<string, unknown>) => { check(await sb().rpc(fn, args)); };
  return {
    async people() {
      const [people, stats] = await Promise.all([
        sb().from("reavers_app_people").select("*").order("name").limit(5000).then(check) as Promise<Omit<Person, "stats">[]>,
        sb().from("reavers_app_people_stats").select("*").limit(5000).then(check) as Promise<(PersonStats & { person_id: string })[]>
      ]);
      const byId = new Map(stats.map(s => [s.person_id, s]));
      return people.map(p => {
        const s = byId.get(p.id);
        return { ...p, stats: s ? { ...EMPTY_STATS, ...s, total: Number(s.total), practices: Number(s.practices), tournaments: Number(s.tournaments), events: Number(s.events), fundraisers: Number(s.fundraisers), recent: Number(s.recent) } : EMPTY_STATS };
      });
    },
    async savePerson(id, details) {
      if (id) check(await sb().from("reavers_app_people").update(details).eq("id", id));
      else check(await sb().from("reavers_app_people").insert(details));
    },
    async removePerson(id) { check(await sb().from("reavers_app_people").delete().eq("id", id)); },
    async gatherings() {
      return check(await sb().from("reavers_app_gatherings").select("id,kind,title,date,notes").order("date", { ascending: false }).limit(5000)) as Gathering[];
    },
    async saveGathering(id, g) {
      const q = id ? sb().from("reavers_app_gatherings").update(g).eq("id", id) : sb().from("reavers_app_gatherings").insert(g);
      return check(await q.select("id,kind,title,date,notes").single()) as Gathering;
    },
    async removeGathering(id) { check(await sb().from("reavers_app_gatherings").delete().eq("id", id)); },
    async present(gatheringId) {
      const rows = check(await sb().from("reavers_app_attendance").select("person_id").eq("gathering_id", gatheringId)) as { person_id: string }[];
      return rows.map(r => r.person_id);
    },
    async setPresent(gatheringId, personId, present) {
      if (present) check(await sb().from("reavers_app_attendance").upsert({ gathering_id: gatheringId, person_id: personId }, { onConflict: "gathering_id,person_id", ignoreDuplicates: true }));
      else check(await sb().from("reavers_app_attendance").delete().eq("gathering_id", gatheringId).eq("person_id", personId));
    },
    startRemoval: (id, days, note) => rpc("reavers_app_start_removal", { p_person: id, p_days: days, p_note: note }),
    stopRemoval: (id, note) => rpc("reavers_app_stop_removal", { p_person: id, p_note: note }),
    markRemoved: id => rpc("reavers_app_mark_removed", { p_person: id }),
    setAway: (id, away) => rpc("reavers_app_set_away", { p_person: id, p_away: away }),
    async askOnDiscord(id) {
      const { data, error } = await sb().functions.invoke("reavers-attendance-bot", { body: { action: "ask", person_id: id } });
      if (error) {
        let message = error.message;
        try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) message = body.error; } catch { /* keep the generic message */ }
        if (/Failed to send|NetworkError|Load failed|404/i.test(message)) message = "The Discord bot isn't set up on the server yet, so nothing was sent.";
        throw new Error(message);
      }
      return String((data as { message?: string })?.message || "Sent on Discord");
    }
  };
}

// ------------------------------------------------------------------ sample data (demo mode)

const KEY = "reavers-app-attendance-demo-v1";
type DemoDb = { people: Omit<Person, "stats">[]; gatherings: Gathering[]; attendance: { g: string; p: string }[] };
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let n = 0;
const uid = () => `demo-att-${Date.now().toString(36)}-${(n++).toString(36)}`;

function demoSeed(): DemoDb {
  const blank = { user_id: null, fighter_id: null, membership_id: null, discord_id: null, discord_name: null, last_contact_note: null, notes: null, removal_started_at: null, removal_deadline: null, removal_note: null, removed_on: null, dm_sent_at: null, dm_error: null, reply_text: null, reply_at: null };
  const person = (name: string, started: number, contact: number | null, o: Partial<Person> = {}) =>
    ({ ...blank, id: uid(), name, started_on: day(started), last_contact_on: contact === null ? null : day(contact), status: "active" as PersonStatus, created_at: new Date().toISOString(), ...o });
  const people = [
    person("Garrett (sample)", -900, -1, { discord_name: "garrett" }),
    person("Jordan (sample)", -500, -3, { discord_name: "jordan.swings" }),
    person("Alex (sample)", -420, -6),
    person("Sam (sample)", -60, -10),
    person("Casey (sample)", -700, -150, { discord_name: "casey_k", last_contact_note: "Said work was busy" }),
    person("Drew (sample)", -800, -200),
    person("Riley (sample)", -365, -60, { status: "removal", removal_started_at: new Date(Date.now() - 12 * 864e5).toISOString(), removal_deadline: day(18), removal_note: "No practice since spring", dm_sent_at: new Date(Date.now() - 12 * 864e5).toISOString(), reply_text: "Sorry, moved to Calgary for school. Want to stay on for tournaments if that's ok.", reply_at: new Date(Date.now() - 9 * 864e5).toISOString() }),
    person("Morgan (sample)", -600, -40, { status: "away", notes: "Shoulder surgery, back in the new year" })
  ];
  const gatherings: Gathering[] = [];
  for (let w = 0; w < 30; w++) {
    gatherings.push({ id: uid(), kind: "practice", title: "Wednesday practice", date: day(-7 * w - 2), notes: null });
    gatherings.push({ id: uid(), kind: "practice", title: "Sunday practice", date: day(-7 * w - 5), notes: null });
  }
  gatherings.push({ id: uid(), kind: "tournament", title: "Prairie Brawl", date: day(-40), notes: null });
  gatherings.push({ id: uid(), kind: "tournament", title: "Spring Melee", date: day(-160), notes: null });
  gatherings.push({ id: uid(), kind: "event", title: "Demo at the Westerner", date: day(-25), notes: null });
  gatherings.push({ id: uid(), kind: "fundraiser", title: "Bottle drive", date: day(-18), notes: null });
  gatherings.push({ id: uid(), kind: "fundraiser", title: "Fight Night", date: day(-120), notes: null });
  gatherings.sort((a, b) => b.date.localeCompare(a.date));
  // How keen each sample person is, and the last day they came.
  const keen: [number, number, number][] = [[0, 0.95, 0], [1, 0.8, 0], [2, 0.5, -20], [3, 0.7, 0], [4, 0.6, -110], [5, 0.5, -190], [6, 0.4, -100], [7, 0.8, -50]];
  const attendance: { g: string; p: string }[] = [];
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [i, rate, until] of keen) {
    const p = people[i];
    for (const g of gatherings) if (g.date >= (p.started_on || "") && g.date <= day(until) && rand() < rate) attendance.push({ g: g.id, p: p.id });
  }
  return { people, gatherings, attendance };
}

export function demoAttendance(): AttendanceApi {
  let db: DemoDb;
  try { db = JSON.parse(localStorage.getItem(KEY) || "null") || demoSeed(); } catch { db = demoSeed(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  const find = (id: string) => { const p = db.people.find(x => x.id === id); if (!p) throw new Error("Person not found"); return p; };
  const today = day(0);
  return {
    async people() {
      const byG = new Map(db.gatherings.map(g => [g.id, g]));
      const from = (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return day(Math.round((d.getTime() - Date.now()) / 864e5)); })();
      return structuredClone(db.people).sort((a, b) => a.name.localeCompare(b.name)).map(p => {
        const mine = db.attendance.filter(a => a.p === p.id).map(a => byG.get(a.g)).filter((g): g is Gathering => Boolean(g) && g!.date <= today);
        const dates = mine.map(g => g.date).sort();
        const practices = mine.filter(g => g.kind === "practice").map(g => g.date).sort();
        return {
          ...p, stats: {
            total: mine.length, practices: practices.length, tournaments: mine.filter(g => g.kind === "tournament").length,
            events: mine.filter(g => g.kind === "event").length, fundraisers: mine.filter(g => g.kind === "fundraiser").length,
            recent: mine.filter(g => g.date > from).length, first_seen: dates[0] || null, last_seen: dates[dates.length - 1] || null, last_practice: practices[practices.length - 1] || null
          }
        };
      });
    },
    async savePerson(id, details) {
      if (id) Object.assign(find(id), details);
      else db.people.push({
        user_id: null, fighter_id: null, membership_id: null, discord_id: null, discord_name: null, last_contact_on: null, last_contact_note: null,
        notes: null, started_on: today, ...details, name: details.name || "Member", id: uid(), status: "active", removal_started_at: null,
        removal_deadline: null, removal_note: null, removed_on: null, dm_sent_at: null, dm_error: null, reply_text: null, reply_at: null,
        created_at: new Date().toISOString()
      });
      save();
    },
    async removePerson(id) { db.people = db.people.filter(p => p.id !== id); db.attendance = db.attendance.filter(a => a.p !== id); save(); },
    async gatherings() { return structuredClone(db.gatherings); },
    async saveGathering(id, g) {
      let row: Gathering;
      if (id) { row = db.gatherings.find(x => x.id === id)!; Object.assign(row, g); }
      else { row = { id: uid(), kind: "practice", title: "", date: today, notes: null, ...g }; db.gatherings.push(row); }
      db.gatherings.sort((a, b) => b.date.localeCompare(a.date));
      save();
      return { ...row };
    },
    async removeGathering(id) { db.gatherings = db.gatherings.filter(g => g.id !== id); db.attendance = db.attendance.filter(a => a.g !== id); save(); },
    async present(gid) { return db.attendance.filter(a => a.g === gid).map(a => a.p); },
    async setPresent(gid, pid, present) {
      db.attendance = db.attendance.filter(a => !(a.g === gid && a.p === pid));
      if (present) db.attendance.push({ g: gid, p: pid });
      save();
    },
    async startRemoval(id, days, note) {
      const p = find(id);
      if (p.status !== "active" && p.status !== "away") throw new Error("This person already has a timer running or has been removed");
      Object.assign(p, { status: "removal", removal_started_at: new Date().toISOString(), removal_deadline: day(days), removal_note: note || null, reply_text: null, reply_at: null, dm_sent_at: null, dm_error: null });
      save();
    },
    async stopRemoval(id, note) {
      const p = find(id);
      Object.assign(p, { status: "active", removal_started_at: null, removal_deadline: null, removal_note: null, removed_on: null, notes: note ? [p.notes, `${today} kept on: ${note}`].filter(Boolean).join("\n") : p.notes });
      save();
    },
    async markRemoved(id) {
      const p = find(id);
      if (p.status !== "removal") throw new Error("Start the removal timer first");
      if ((p.removal_deadline || "") > today) throw new Error("The timer hasn't run out yet; stop it or wait");
      Object.assign(p, { status: "removed", removed_on: today });
      save();
    },
    async setAway(id, away) { find(id).status = away ? "away" : "active"; save(); },
    async askOnDiscord(id) {
      const p = find(id);
      p.dm_sent_at = new Date().toISOString();
      p.dm_error = null;
      save();
      return `Sample mode: nothing was sent, but on the live app the bot would message ${p.name} on Discord now.`;
    }
  };
}

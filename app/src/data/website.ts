import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "./config";

// The public website's own records (calendar, practices, people added by hand, community inquiries, settings) live in the
// BuhurtOS function public.reavers_site. Only a Red Deer Reavers captain can change them; the database checks that, not the app.
// Fighter profiles, BuhurtOS events and club membership are read from BuhurtOS itself.

export type SiteSettings = { season: string | null; organization: string | null; location: string | null; contact_email: string | null };
export type SitePractice = {
  id: string; weekday: number; label: string; start_time: string; end_time: string; venue: string | null; fee: string | null; active: boolean; sort_order: number;
};
export const EVENT_TYPES = ["tournament", "demo", "meeting", "social", "practice", "other"] as const;
export type SiteEvent = {
  id: string; title: string; event_type: (typeof EVENT_TYPES)[number]; event_date: string; start_time: string | null; end_time: string | null;
  location: string | null; details: string | null; href: string | null; is_public: boolean;
};
export type SitePerson = {
  id: string; name: string; role: string | null; discipline: string | null; bio: string | null; photo_url: string | null; active: boolean;
  is_example: boolean; sort_order: number; experience_years: number | null; affiliations: string | null; experience_summary: string | null;
};
export const INQUIRY_STATUSES = ["new", "contacted", "booked", "closed", "declined"] as const;
export type SiteInquiry = {
  id: string; name: string; organization: string | null; contact: string; event_type: string | null; event_date: string | null;
  location: string | null; audience_size: string | null; details: string | null; status: string | null; created_at: string;
};
export type SiteData = {
  admin: boolean; settings: SiteSettings; practices: SitePractice[]; events: SiteEvent[]; roster: SitePerson[]; communityInquiries: SiteInquiry[];
};
export type BosFighter = { id: string; name: string; captain: boolean; hasPhoto: boolean; cardUrl: string };
export type BosEvent = { id: string; name: string; startsOn: string; endsOn: string; where: string; url: string; reavers: "hosting" | "entered" | ""; past: boolean };
export type ClubMember = {
  membership_id: string; full_name: string; status: string; office: string | null; dues_status: string | null; eligible: boolean; fighter_id: string | null;
};
export type ClubMembers =
  | { ok: true; feeWaived: boolean; members: ClubMember[] }
  | { ok: false; reason: string };

export type SiteAction =
  | { action: "event_save"; item: Partial<SiteEvent> } | { action: "event_delete"; id: string }
  | { action: "practice_save"; item: Partial<SitePractice> } | { action: "practice_delete"; id: string }
  | { action: "roster_save"; item: Partial<SitePerson> } | { action: "roster_delete"; id: string } | { action: "roster_reorder"; ids: string[] }
  | { action: "community_inquiry_status"; id: string; status: string } | { action: "community_inquiry_delete"; id: string }
  | { action: "settings_save"; item: SiteSettings };

export interface WebsiteApi {
  get(): Promise<SiteData>;
  act(body: SiteAction): Promise<void>;
  fighters(): Promise<BosFighter[]>;
  bosEvents(): Promise<BosEvent[]>;
  clubMembers(): Promise<ClubMembers>;
}

export const BOS_APP = "https://buhurt-os.app";
export const TEAM_SLUG = "red-deer-reavers";
/** A roster record whose discipline is "hide-buhurtos:<fighter id>" is not a person: it keeps that BuhurtOS fighter off the public pages. */
export const HIDE = "hide-buhurtos:";
export const isHideRecord = (p: Pick<SitePerson, "discipline">) => String(p.discipline || "").startsWith(HIDE);
export const hiddenFighterId = (p: Pick<SitePerson, "discipline">) => String(p.discipline || "").slice(HIDE.length).trim().toLowerCase();
export const sameName = (a: string | null | undefined, b: string | null | undefined) =>
  String(a || "").trim().toLowerCase().replace(/\s+/g, " ") === String(b || "").trim().toLowerCase().replace(/\s+/g, " ");

const EMPTY: SiteData = { admin: false, settings: { season: null, organization: null, location: null, contact_email: null }, practices: [], events: [], roster: [], communityInquiries: [] };
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const place = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function check<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
  return r.data;
}

export function liveWebsite(sb: () => SupabaseClient): WebsiteApi {
  const team = async () => check(await sb().from("teams").select("id,name,slug").eq("slug", TEAM_SLUG).maybeSingle()) as { id: string } | null;
  // Fails closed, like the public site: if test records cannot be identified, the call fails rather than show them.
  const synthetic = async (type: string, ids: string[]) => {
    if (!ids.length) return new Set<string>();
    const rows = check(await sb().from("synthetic_records").select("entity_id").eq("entity_type", type).in("entity_id", ids)) as { entity_id: string }[];
    return new Set(rows.map(r => r.entity_id));
  };
  return {
    async get() {
      const data = check(await sb().rpc("reavers_site", { p: { action: "get" } })) as Partial<SiteData> | null;
      return { ...EMPTY, ...(data || {}), settings: { ...EMPTY.settings, ...(data?.settings || {}) } };
    },
    async act(body) {
      check(await sb().rpc("reavers_site", { p: body }));
    },
    async fighters() {
      const t = await team();
      if (!t) return [];
      const roster = (check(await sb().rpc("team_roster", { p_team: t.id })) || []) as { fighter_id: string; display_name?: string; is_captain?: boolean }[];
      const ids = roster.map(r => r.fighter_id).filter(id => UUID.test(id));
      if (!ids.length) return [];
      const [details, fake] = await Promise.all([
        sb().from("fighters").select("id,display_name,avatar_path").in("id", ids).then(check) as Promise<{ id: string; display_name: string | null; avatar_path: string | null }[]>,
        synthetic("fighter", ids)
      ]);
      const byId = new Map(details.map(d => [d.id, d]));
      return roster.filter(r => byId.has(r.fighter_id) && !fake.has(r.fighter_id)).map(r => {
        const f = byId.get(r.fighter_id)!;
        return { id: f.id, name: f.display_name || r.display_name || "Fighter", captain: Boolean(r.is_captain), hasPhoto: Boolean(f.avatar_path), cardUrl: `${SITE_URL}fighter.html?id=${encodeURIComponent(f.id)}` };
      });
    },
    async bosEvents() {
      const t = await team();
      const today = new Date().toISOString().slice(0, 10);
      const cols = "id,name,slug,status,starts_on,ends_on,city,region,venue,host_team_id";
      type Row = { id: string; name: string; slug: string; status: string; starts_on: string; ends_on: string | null; city: string | null; region: string | null; venue: string | null; host_team_id: string | null };
      const [upcoming, past, entered] = await Promise.all([
        sb().from("events").select(cols).eq("status", "published").gte("ends_on", today).order("starts_on", { ascending: true }).limit(300).then(check) as Promise<Row[]>,
        sb().from("events").select(cols).eq("status", "published").lt("ends_on", today).order("starts_on", { ascending: false }).limit(600).then(r => (r.error ? [] : r.data)) as Promise<Row[]>,
        t ? sb().from("entries").select("status,competitions!entries_competition_id_fkey(name,events(id))").eq("team_id", t.id).then(r => (r.error ? [] : r.data)) : Promise.resolve([])
      ]);
      const enteredIn = new Set<string>();
      for (const row of (entered || []) as { status: string; competitions: unknown }[]) {
        if (row.status === "withdrawn") continue;
        const comp = (Array.isArray(row.competitions) ? row.competitions[0] : row.competitions) as { events?: unknown } | null;
        const ev = comp && ((Array.isArray(comp.events) ? comp.events[0] : comp.events) as { id?: string } | null);
        if (ev?.id) enteredIn.add(ev.id);
      }
      const rows = [...upcoming, ...past];
      const fake = await synthetic("event", rows.map(e => e.id));
      return rows.filter(e => !fake.has(e.id)).map(e => ({
        id: e.id, name: e.name, startsOn: e.starts_on, endsOn: e.ends_on || e.starts_on, where: place(e.venue, place(e.city, e.region)),
        url: `${BOS_APP}/events/${encodeURIComponent(e.slug)}`,
        reavers: t && e.host_team_id === t.id ? "hosting" : enteredIn.has(e.id) ? "entered" : "",
        past: (e.ends_on || e.starts_on) < today
      }));
    },
    async clubMembers() {
      const { data: s } = await sb().auth.getSession();
      const email = s.session?.user.email || "this account";
      const t = await team();
      if (!t) return { ok: false, reason: "Could not find the Red Deer Reavers in BuhurtOS." };
      const o = await sb().rpc("club_membership_overview", { p_team: t.id });
      if (o.error) return { ok: false, reason: `Could not read the membership: ${o.error.message}` };
      if (!o.data?.can_view_roster) return { ok: false, reason: `${email} is not a current executive account, so the members list stays private.` };
      const year = o.data.current_year;
      const [roster, links] = await Promise.all([
        sb().rpc("club_member_roster", { p_team: t.id, p_year: year }),
        sb().rpc("club_member_profile_links", { p_team: t.id, p_year: year })
      ]);
      if (roster.error) return { ok: false, reason: `Could not load the members list: ${roster.error.message}` };
      const fighterOf = new Map(((links.data || []) as { membership_id: string; fighter_id: string | null }[]).map(x => [x.membership_id, x.fighter_id]));
      return {
        ok: true,
        feeWaived: Boolean(o.data.year?.fee_waived),
        members: ((roster.data || []) as ClubMember[]).map(m => ({ ...m, fighter_id: fighterOf.get(m.membership_id) || null }))
      };
    }
  };
}

// ------------------------------------------------------------------ sample data (demo mode)

const DEMO_KEY = "reavers-app-website-demo-v1";
/** The sample tournament that has sign-ups set up in demo mode (data/demo.ts). */
export const DEMO_TOURNAMENT_ID = "00000000-0000-4000-8000-00000000e001";
let n = 0;
const uid = () => `00000000-0000-4000-8000-${(Date.now() + n++).toString(16).padStart(12, "0").slice(-12)}`;
const dayFrom = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

function demoSeed(): SiteData {
  return {
    admin: true,
    settings: { season: "2026", organization: "Red Deer Reavers", location: "Central Alberta", contact_email: "reddeerreavers@gmail.com" },
    practices: [
      { id: uid(), weekday: 3, label: "Wednesday", start_time: "17:30:00", end_time: "20:00:00", venue: "Springbrook Archery Centre", fee: "$10", active: true, sort_order: 10 },
      { id: uid(), weekday: 0, label: "Sunday", start_time: "17:00:00", end_time: "20:00:00", venue: "Springbrook Archery Centre", fee: "$10", active: true, sort_order: 20 }
    ],
    events: [
      { id: DEMO_TOURNAMENT_ID, title: "Reavers Winter Brawl (sample)", event_type: "tournament", event_date: dayFrom(24), start_time: "10:00:00", end_time: "17:00:00", location: "Springbrook Archery Centre", details: "Buhurt and duels. Fighters register ahead; visitors pay at the door or online.", href: null, is_public: true },
      { id: uid(), title: "Demo at the Westerner (sample)", event_type: "demo", event_date: dayFrom(9), start_time: "13:00:00", end_time: "15:00:00", location: "Westerner Park", details: "Two bouts and a kit show-and-tell.", href: null, is_public: true },
      { id: uid(), title: "Executive meeting (sample)", event_type: "meeting", event_date: dayFrom(4), start_time: "19:00:00", end_time: null, location: "Online", details: null, href: null, is_public: false },
      { id: uid(), title: "Fight night social (sample)", event_type: "social", event_date: dayFrom(17), start_time: "18:00:00", end_time: null, location: "Red Deer", details: null, href: null, is_public: true }
    ],
    roster: [
      { id: uid(), name: "Morgan (sample)", role: "Armourer", discipline: "Armour support", bio: null, photo_url: null, active: true, is_example: true, sort_order: 10, experience_years: 6, affiliations: null, experience_summary: null },
      { id: uid(), name: "Riley (sample)", role: "Media", discipline: "Photo and video", bio: null, photo_url: null, active: false, is_example: true, sort_order: 20, experience_years: null, affiliations: null, experience_summary: null }
    ],
    communityInquiries: [
      { id: uid(), name: "Pat Lee (sample)", organization: "Lindsay Thurber High School", contact: "pat@example.com", event_type: "school_session", event_date: dayFrom(30), location: "Red Deer", audience_size: "60", details: "Grade 10 history classes, about an hour.", status: "new", created_at: new Date().toISOString() },
      { id: uid(), name: "Sam Ortiz (sample)", organization: null, contact: "403-555-0100", event_type: "birthday", event_date: null, location: "Sylvan Lake", audience_size: "15", details: null, status: "contacted", created_at: new Date(Date.now() - 6 * 864e5).toISOString() }
    ]
  };
}

export function demoWebsite(): WebsiteApi {
  let db: SiteData;
  try { db = JSON.parse(localStorage.getItem(DEMO_KEY) || "null") || demoSeed(); } catch { db = demoSeed(); }
  const save = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  const upsert = <T extends { id: string }>(list: T[], item: Partial<T>, base: T): T[] => {
    const current = item.id ? list.find(x => x.id === item.id) : undefined;
    if (current) return list.map(x => (x === current ? { ...x, ...item } : x));
    return [...list, { ...base, ...item, id: uid() }];
  };
  const fighters: BosFighter[] = [
    { id: "f0000000-0000-4000-8000-000000000001", name: "Garrett (sample)", captain: true, hasPhoto: true, cardUrl: `${SITE_URL}team.html` },
    { id: "f0000000-0000-4000-8000-000000000002", name: "Jordan (sample)", captain: false, hasPhoto: false, cardUrl: `${SITE_URL}team.html` },
    { id: "f0000000-0000-4000-8000-000000000003", name: "Alex (sample)", captain: false, hasPhoto: true, cardUrl: `${SITE_URL}team.html` }
  ];
  return {
    async get() { return structuredClone(db); },
    async act(body) {
      switch (body.action) {
        case "event_save": db.events = upsert(db.events, body.item, { id: "", title: "", event_type: "other", event_date: localToday(), start_time: null, end_time: null, location: null, details: null, href: null, is_public: true }); break;
        case "practice_save": db.practices = upsert(db.practices, body.item, { id: "", weekday: 0, label: "Practice", start_time: "17:00", end_time: "20:00", venue: null, fee: null, active: true, sort_order: 0 }); break;
        case "roster_save": db.roster = upsert(db.roster, body.item, { id: "", name: "", role: null, discipline: null, bio: null, photo_url: null, active: true, is_example: false, sort_order: 0, experience_years: null, affiliations: null, experience_summary: null }); break;
        case "event_delete": db.events = db.events.filter(x => x.id !== body.id); break;
        case "practice_delete": db.practices = db.practices.filter(x => x.id !== body.id); break;
        case "roster_delete": db.roster = db.roster.filter(x => x.id !== body.id); break;
        case "roster_reorder": body.ids.forEach((rid, i) => { const p = db.roster.find(x => x.id === rid); if (p) p.sort_order = (i + 1) * 10; }); break;
        case "community_inquiry_status": db.communityInquiries = db.communityInquiries.map(x => (x.id === body.id ? { ...x, status: body.status } : x)); break;
        case "community_inquiry_delete": db.communityInquiries = db.communityInquiries.filter(x => x.id !== body.id); break;
        case "settings_save": db.settings = { ...body.item }; break;
      }
      db.events.sort((a, b) => a.event_date.localeCompare(b.event_date));
      db.roster.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      db.practices.sort((a, b) => a.sort_order - b.sort_order || a.weekday - b.weekday);
      save();
    },
    async fighters() { return fighters; },
    async bosEvents() {
      return [
        { id: "e1", name: "Prairie Brawl (sample)", startsOn: dayFrom(12), endsOn: dayFrom(13), where: "Calgary, AB", url: `${BOS_APP}/events`, reavers: "entered", past: false },
        { id: "e2", name: "Northern Steel Open (sample)", startsOn: dayFrom(40), endsOn: dayFrom(40), where: "Edmonton, AB", url: `${BOS_APP}/events`, reavers: "", past: false },
        { id: "e3", name: "Spring Melee (sample)", startsOn: dayFrom(-60), endsOn: dayFrom(-59), where: "Red Deer, AB", url: `${BOS_APP}/events`, reavers: "hosting", past: true }
      ];
    },
    async clubMembers() {
      return {
        ok: true, feeWaived: false, members: [
          { membership_id: "m1", full_name: "Garrett (sample)", status: "active", office: "President", dues_status: "paid", eligible: true, fighter_id: fighters[0].id },
          { membership_id: "m2", full_name: "Casey (sample)", status: "active", office: "Treasurer", dues_status: "paid", eligible: true, fighter_id: null },
          { membership_id: "m3", full_name: "Drew (sample)", status: "pending", office: null, dues_status: null, eligible: false, fighter_id: null }
        ]
      };
    }
  };
}

/*
 * BuhurtOS connection for the Reavers site.
 * Fighter profiles, the team roster, team record and tournament history come straight from BuhurtOS,
 * so a fighter who builds a profile there and joins the Red Deer Reavers appears here automatically.
 *
 * Read only. Uses the BuhurtOS publishable (browser-safe) key and public views/functions only.
 * Nothing here reads or shows account ids, birth year, age, gender, health or contact data.
 * Synthetic/test records are left out of the roster and history, and flagged if opened directly.
 */
(() => {
  const CONFIG = {
    url: "https://mvbxlebznlgroptwwdsm.supabase.co",
    key: "sb_publishable_u76M-dggKSsdsyhUQKveJg_5fPJ5Nan",
    site: "https://buhurt-os.vercel.app", // BuhurtOS on Vercel (buhurtos.ca is not a working address)
    teamSlug: "red-deer-reavers"
  };
  const CACHE_MS = 5 * 60 * 1000;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const CATEGORY_NAMES = {
    "3v3": "3v3", "5v5": "5v5", "12v12": "12v12", "30v30": "30v30",
    sword_shield: "Sword & Shield", buckler: "Sword & Buckler", longsword: "Longsword", polearm: "Polearm",
    profight: "Profight", sabre: "Sabre", greatsword: "Greatsword", triathlon: "Triathlon", marathon: "Marathon (relay)"
  };

  const links = {
    fighter: id => `${CONFIG.site}/fighters/${encodeURIComponent(id)}`,
    team: `${CONFIG.site}/teams/${CONFIG.teamSlug}`,
    join: `${CONFIG.site}/team-manager?join=${CONFIG.teamSlug}`,
    account: `${CONFIG.site}/account`,
    claim: `${CONFIG.site}/claim-profile`,
    event: slug => `${CONFIG.site}/events/${encodeURIComponent(slug)}`,
    home: CONFIG.site
  };

  const cacheGet = key => {
    try {
      const raw = sessionStorage.getItem(`buhurtos:${key}`);
      if (!raw) return null;
      const { at, value } = JSON.parse(raw);
      return Date.now() - at < CACHE_MS ? value : null;
    } catch { return null; }
  };
  const cacheSet = (key, value) => {
    try { sessionStorage.setItem(`buhurtos:${key}`, JSON.stringify({ at: Date.now(), value })); } catch { /* storage unavailable */ }
  };

  async function rest(path, { method = "GET", body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(`${CONFIG.url}/rest/v1/${path}`, {
        method,
        headers: { apikey: CONFIG.key, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`BuhurtOS request failed (${response.status})`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const rpc = (fn, args) => rest(`rpc/${fn}`, { method: "POST", body: args });
  const inList = ids => `(${ids.map(id => encodeURIComponent(id)).join(",")})`;

  const avatarUrl = path => path
    ? `${CONFIG.url}/storage/v1/object/public/avatars/${String(path).split("/").map(encodeURIComponent).join("/")}`
    : "";
  const categoryName = code => CATEGORY_NAMES[code] || String(code || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const place = (city, region) => [city, region].filter(Boolean).join(", ");

  async function syntheticIds(type, ids) {
    if (!ids.length) return new Set();
    // Fails closed: if test records cannot be identified, nothing is shown rather than risk showing them.
    if (ids.length > 40) {
      const wanted = new Set(ids);
      const all = await rest(`synthetic_records?select=entity_id&entity_type=eq.${type}&limit=2000`);
      return new Set(all.map(r => r.entity_id).filter(id => wanted.has(id)));
    }
    const rows = await rest(`synthetic_records?select=entity_id&entity_type=eq.${type}&entity_id=in.${inList(ids)}`);
    return new Set(rows.map(r => r.entity_id));
  }

  async function team() {
    const cached = cacheGet("team");
    if (cached) return cached;
    const rows = await rest(`teams?select=id,slug,name,city,region&slug=eq.${CONFIG.teamSlug}&limit=1`);
    const value = rows[0] || null;
    if (value) cacheSet("team", value);
    return value;
  }

  const FIGHTER_COLUMNS = "id,display_name,city,region,country,joined_year,disciplines,fighting_style,bio,highlights,avatar_path,social_links";

  function toFighter(row, rosterRow) {
    return {
      id: row.id,
      name: row.display_name || rosterRow?.display_name || "Fighter",
      captain: Boolean(rosterRow?.is_captain),
      role: rosterRow?.role || "fighter",
      mercenary: Boolean(rosterRow?.mercenary),
      since: rosterRow?.since || null,
      city: row.city || "",
      region: row.region || "",
      country: row.country || "",
      where: place(row.city, row.region),
      joinedYear: row.joined_year ?? null,
      disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
      style: row.fighting_style || "",
      bio: row.bio || "",
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      avatar: avatarUrl(row.avatar_path),
      socials: row.social_links && typeof row.social_links === "object" ? row.social_links : {},
      profileUrl: `fighter.html?id=${encodeURIComponent(row.id)}`,
      buhurtosUrl: links.fighter(row.id)
    };
  }

  /** Current Red Deer Reavers roster from BuhurtOS, captain first. Synthetic fighters are left out. */
  async function teamRoster() {
    const cached = cacheGet("roster");
    if (cached) return cached;
    const t = await team();
    if (!t) return { team: null, fighters: [] };
    const roster = await rpc("team_roster", { p_team: t.id });
    const ids = roster.map(r => r.fighter_id).filter(id => UUID.test(id));
    if (!ids.length) {
      const empty = { team: t, fighters: [] };
      cacheSet("roster", empty);
      return empty;
    }
    const [details, synthetic] = await Promise.all([
      rest(`fighters?select=${FIGHTER_COLUMNS}&id=in.${inList(ids)}`),
      syntheticIds("fighter", ids)
    ]);
    const byId = new Map(details.map(d => [d.id, d]));
    const fighters = roster
      .filter(r => byId.has(r.fighter_id) && !synthetic.has(r.fighter_id))
      .map(r => toFighter(byId.get(r.fighter_id), r));
    const value = { team: t, fighters };
    cacheSet("roster", value);
    return value;
  }

  async function teamStats() {
    const rows = await rest(`team_stats?select=team_id,events,matches,wins,losses,draws,win_pct,golds,silvers,bronzes,podiums,tournament_wins,points,recent_form&team_slug=eq.${CONFIG.teamSlug}&limit=1`);
    const r = rows[0];
    if (!r) return null;
    const n = v => Number(v ?? 0);
    return {
      events: n(r.events), matches: n(r.matches), wins: n(r.wins), losses: n(r.losses), draws: n(r.draws),
      winPct: r.win_pct === null || r.win_pct === undefined ? null : Number(r.win_pct),
      golds: n(r.golds), silvers: n(r.silvers), bronzes: n(r.bronzes), podiums: n(r.podiums),
      tournamentWins: n(r.tournament_wins), points: n(r.points),
      form: [...String(r.recent_form || "")].filter(c => c === "W" || c === "L" || c === "D")
    };
  }

  const RESULT_COLUMNS = "competition_id,competition_name,category,gender,event_slug,event_name,starts_on,event_ends_on,final_place,points,synthetic";
  const toResult = r => ({
    competition: r.competition_name, category: categoryName(r.category), gender: r.gender,
    event: r.event_name, eventUrl: links.event(r.event_slug), startsOn: r.starts_on, endsOn: r.event_ends_on,
    place: Number(r.final_place), points: Number(r.points ?? 0)
  });

  /** Team placings, newest first. Fictional/test events are left out. */
  async function teamResults(limit = 12) {
    const t = await team();
    if (!t) return [];
    const rows = await rest(`team_results_all?select=${RESULT_COLUMNS}&team_id=eq.${t.id}&order=event_ends_on.desc&limit=${limit * 2}`);
    return rows.filter(r => !r.synthetic).slice(0, limit).map(toResult);
  }

  /**
   * Every published event on BuhurtOS, past and future, each flagged `past`. Upcoming ones come soonest first and
   * past ones newest first. Events the Reavers host or entered carry `reavers: "hosting" | "entered"`.
   * Fictional/test events are left out. Each one links to its BuhurtOS page for details, registration and results.
   */
  async function allEvents() {
    const t = await team();
    const today = new Date().toISOString().slice(0, 10);
    const columns = "id,name,slug,event_type,status,starts_on,ends_on,city,region,venue,description,host_team_id";
    const [upcoming, past, entered] = await Promise.all([
      rest(`events?select=${columns}&status=eq.published&ends_on=gte.${today}&order=starts_on.asc&limit=300`),
      rest(`events?select=${columns}&status=eq.published&ends_on=lt.${today}&order=starts_on.desc&limit=600`).catch(() => []),
      t ? rest(`entries?select=status,competitions!entries_competition_id_fkey(name,events(id))&team_id=eq.${t.id}`).catch(() => []) : []
    ]);
    const enteredIn = new Map();
    for (const row of entered) {
      if (row.status === "withdrawn") continue;
      const comp = Array.isArray(row.competitions) ? row.competitions[0] : row.competitions;
      const ev = comp && (Array.isArray(comp.events) ? comp.events[0] : comp.events);
      if (!ev?.id) continue;
      const names = enteredIn.get(ev.id) || [];
      if (comp.name && !names.includes(comp.name)) names.push(comp.name);
      enteredIn.set(ev.id, names);
    }
    const toItem = ev => ({
      id: ev.id, name: ev.name, slug: ev.slug, type: ev.event_type || "tournament", startsOn: ev.starts_on, endsOn: ev.ends_on,
      where: [ev.venue, place(ev.city, ev.region)].filter(Boolean).join(", "),
      details: String(ev.description || "").replace(/\s+/g, " ").trim().slice(0, 220), url: links.event(ev.slug),
      competitions: enteredIn.get(ev.id) || [],
      reavers: t && ev.host_team_id === t.id ? "hosting" : enteredIn.has(ev.id) ? "entered" : "",
      past: (ev.ends_on || ev.starts_on) < today
    });
    const rows = [...upcoming, ...past].filter(ev => ev && ev.status === "published");
    // Fails closed: if test events cannot be identified, none are shown.
    const synthetic = await syntheticIds("event", rows.map(ev => ev.id));
    return rows.filter(ev => !synthetic.has(ev.id)).map(toItem);
  }

  /** One fighter's public profile, career numbers and placings. Null when the id is unknown. */
  async function fighter(id) {
    if (!UUID.test(String(id || ""))) return null;
    const [profileRows, detailRows, careerRows, history, synthetic] = await Promise.all([
      rpc("fighter_profile", { p_fighter: id }),
      rest(`fighters?select=${FIGHTER_COLUMNS}&id=eq.${id}&limit=1`),
      rest(`fighter_career_stats?select=events_attended,matches,wins,losses,draws,win_pct,golds,silvers,bronzes,podiums,tournament_victories,points&fighter_id=eq.${id}&limit=1`).catch(() => []),
      rest(`fighter_results_all?select=${RESULT_COLUMNS}&fighter_id=eq.${id}&order=event_ends_on.desc&limit=40`).catch(() => []),
      syntheticIds("fighter", [id])
    ]);
    const p = profileRows[0];
    const d = detailRows[0];
    if (!p && !d) return null;
    const base = toFighter({ ...(d || {}), id, display_name: p?.display_name || d?.display_name }, null);
    const c = careerRows[0] || {};
    const n = v => Number(v ?? 0);
    return {
      ...base,
      team: p?.team_slug ? { name: p.team_name, slug: p.team_slug, isReavers: p.team_slug === CONFIG.teamSlug } : null,
      organization: p?.team_organization_name || "",
      synthetic: synthetic.has(id),
      career: {
        events: n(c.events_attended), matches: n(c.matches), wins: n(c.wins), losses: n(c.losses), draws: n(c.draws),
        golds: n(c.golds), silvers: n(c.silvers), bronzes: n(c.bronzes), podiums: n(c.podiums),
        victories: n(c.tournament_victories), points: n(c.points)
      },
      history: history.filter(r => !r.synthetic).map(toResult)
    };
  }

  window.BUHURTOS = { config: CONFIG, links, team, teamRoster, teamStats, teamResults, allEvents, fighter, categoryName, avatarUrl, isId: id => UUID.test(String(id || "")) };
})();

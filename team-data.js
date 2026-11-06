(() => {
  // The team's practices, calendar, roster records and inquiries live on the BuhurtOS home server (public.reavers_site).
  const BACKEND = { url: "https://api-home.buhurtoshome.app", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkzNjQyNTkwLCJleHAiOjE5NTEzMjI1OTB9.f3LpnSfDwX5tVAJPYXAtBGSVtlJTAJE16xjvd_2V_D4" };
  const API = `${BACKEND.url}/rest/v1/rpc/reavers_site`;
  // POST one action ({action, ...}) to BuhurtOS. token: a BuhurtOS sign-in (admin), otherwise the public key.
  const call = async (body, token) => {
    const response = await fetch(API, {
      method: "POST",
      cache: "no-store",
      headers: { apikey: BACKEND.key, Authorization: `Bearer ${token || BACKEND.key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ p: body || { action: "get" } })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.message || payload.error || `Request failed (${response.status})`);
      error.status = response.status; error.code = payload.code;
      throw error;
    }
    return payload;
  };
  const fallback = {
    season: "2026",
    organization: "Red Deer Reavers",
    location: "Central Alberta",
    contactEmail: "reddeerreavers@gmail.com",
    practice: {
      venue: "Springbrook Archery Centre",
      fee: "$10",
      sessions: [
        { day: 3, label: "Wednesday", time: "5:30 PM", end: "8:00 PM", venue: "Springbrook Archery Centre", fee: "$10" },
        { day: 0, label: "Sunday", time: "5:00 PM", end: "8:00 PM", venue: "Springbrook Archery Centre", fee: "$10" }
      ]
    },
    upcomingEvents: [],
    events: [],
    results: [],
    roster: [],
    hiddenFighters: [],
    updates: [
      { tag: "Recruiting", title: "New fighters are welcome", copy: "No armour or combat experience is required to start. Come meet the team and try the basics first.", href: "training.html#start", cta: "Start here" },
      { tag: "Training", title: "Two team practices every week", copy: "Wednesday evenings and Sunday evenings at Springbrook Archery Centre.", href: "training.html", cta: "Training details" },
      { tag: "Community", title: "Book the Reavers", copy: "Armoured combat demos, school sessions, markets, festivals, birthdays and community events.", href: "community.html", cta: "Community options" }
    ]
  };

  const formatClock = value => {
    if (!value) return "";
    const [h, m] = String(value).split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return String(value);
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const todayEdmonton = () => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
  };

  const displayDate = value => {
    if (!value) return "Date TBA";
    const [y, m, d] = String(value).split("-").map(Number);
    if (!y || !m || !d) return String(value);
    return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(y, m - 1, d));
  };

  window.REAVERS_DATA = fallback;
  window.REAVERS_API = API;
  window.REAVERS_BACKEND = BACKEND;
  window.REAVERS_CALL = call;
  window.REAVERS_DATA_PROMISE = (async () => {
    try {
      const data = await call({ action: "get" });
      const settings = data.settings || {};
      const practices = Array.isArray(data.practices) ? data.practices : [];
      const events = Array.isArray(data.events) ? data.events : [];
      const allRoster = Array.isArray(data.roster) ? data.roster : [];
      // A roster record whose discipline is "hide-buhurtos:<fighter id>" is not a person: it tells the site to keep that
      // BuhurtOS fighter off the public pages (set from Admin → Roster → Fighters on BuhurtOS).
      const HIDE = "hide-buhurtos:";
      const isHide = member => String(member.discipline || "").startsWith(HIDE);
      const hiddenFighters = allRoster.filter(isHide).map(member => String(member.discipline).slice(HIDE.length).trim().toLowerCase()).filter(Boolean);
      const roster = allRoster.filter(member => !isHide(member));
      const today = todayEdmonton();
      const publicEvents = events
        .filter(item => item.event_date >= today)
        .sort((a, b) => `${a.event_date} ${a.start_time || ""}`.localeCompare(`${b.event_date} ${b.start_time || ""}`));
      const sessions = practices.map(item => ({
        id: item.id,
        day: Number(item.weekday),
        label: item.label,
        time: formatClock(item.start_time),
        end: formatClock(item.end_time),
        venue: item.venue,
        fee: item.fee || "$10"
      }));
      const mappedEvents = publicEvents.map(item => ({
        id: item.id,
        title: item.title,
        type: item.event_type,
        rawDate: item.event_date,
        rawStartTime: item.start_time ? String(item.start_time).slice(0, 5) : "",
        rawEndTime: item.end_time ? String(item.end_time).slice(0, 5) : "",
        date: displayDate(item.event_date),
        startTime: formatClock(item.start_time),
        endTime: formatClock(item.end_time),
        location: item.location || "",
        details: item.details || "",
        href: item.href || "events.html"
      }));
      return {
        ...fallback,
        season: settings.season || fallback.season,
        organization: settings.organization || fallback.organization,
        location: settings.location || fallback.location,
        contactEmail: settings.contact_email || fallback.contactEmail,
        practice: {
          venue: sessions[0]?.venue || fallback.practice.venue,
          fee: sessions[0]?.fee || fallback.practice.fee,
          sessions: sessions.length ? sessions : fallback.practice.sessions
        },
        upcomingEvents: mappedEvents,
        events: mappedEvents,
        hiddenFighters,
        roster: roster.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          discipline: member.discipline || "",
          bio: member.bio || "",
          experienceYears: member.experience_years ?? null,
          affiliations: member.affiliations || "",
          experienceSummary: member.experience_summary || "",
          photo: member.photo_url || "",
          isExample: Boolean(member.is_example)
        }))
      };
    } catch (error) {
      console.warn("Using built-in Reavers data fallback.", error);
      return fallback;
    }
  })();
})();

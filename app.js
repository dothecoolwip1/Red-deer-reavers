(() => {
  document.documentElement.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- header: transparent over the hero, solid once you scroll ----------
  const header = document.querySelector("[data-header]");
  if (header && !header.classList.contains("always-solid")) {
    const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---------- reveal on scroll ----------
  const revealAll = root => {
    const items = (root || document).querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window) || reduceMotion) { items.forEach(el => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(el => io.observe(el));
  };
  window.REAVERS_REVEAL = revealAll;
  revealAll();

  // ---------- installable app / offline shell ----------
  if ("serviceWorker" in navigator) {
    const register = () => navigator.serviceWorker.register("sw.js?v=26", { updateViaCache: "none" }).then(registration => registration.update()).catch(() => {});
    if (document.readyState === "complete") register(); else window.addEventListener("load", register);
  }

  // ---------- marquee: duplicate the group so the loop is seamless ----------
  document.querySelectorAll("[data-marquee]").forEach(track => {
    const group = track.querySelector(".marquee-group");
    if (!group) return;
    const copy = group.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });

  // ---------- one switch to pause moving decoration ----------
  const motionKey = "reavers:motion-paused";
  const setPaused = paused => {
    document.documentElement.classList.toggle("motion-paused", paused);
    document.querySelectorAll("[data-motion-toggle]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(paused));
      const label = btn.querySelector(".sr-only");
      if (label) label.textContent = paused ? "Play animations" : "Pause animations";
    });
    try { localStorage.setItem(motionKey, paused ? "1" : "0"); } catch { /* storage unavailable */ }
  };
  let storedPause = false;
  try { storedPause = localStorage.getItem(motionKey) === "1"; } catch { /* storage unavailable */ }
  if (storedPause) setPaused(true);
  document.querySelectorAll("[data-motion-toggle]").forEach(btn => btn.addEventListener("click", () => setPaused(!document.documentElement.classList.contains("motion-paused"))));

  // ---------- forge embers over the hero ----------
  const canvas = document.querySelector("[data-embers]");
  if (canvas && !reduceMotion && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const parts = [];
    let w = 0, h = 0, raf = 0, running = false;
    const count = window.innerWidth < 760 ? 34 : 72;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (p, anywhere) => {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : h + 12;
      p.r = Math.random() * 1.7 + 0.5;
      p.vy = -(Math.random() * 0.7 + 0.25);
      p.vx = (Math.random() - 0.5) * 0.35;
      p.life = 0;
      p.max = 380 + Math.random() * 520;
      p.hue = 16 + Math.random() * 28;
      p.phase = Math.random() * Math.PI * 2;
    };
    const tick = () => {
      if (document.documentElement.classList.contains("motion-paused")) { raf = requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.life += 1;
        p.phase += 0.09;
        p.vx += (Math.random() - 0.5) * 0.03;
        p.x += p.vx + Math.sin(p.life / 55) * 0.18;
        p.y += p.vy;
        if (p.y < -12 || p.life > p.max) spawn(p, false);
        const fade = Math.min(1, p.life / 50) * Math.max(0, 1 - p.life / p.max);
        const alpha = fade * (0.55 + 0.45 * Math.sin(p.phase));
        const radius = p.r * 4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        g.addColorStop(0, `hsla(${p.hue},100%,72%,${alpha})`);
        g.addColorStop(0.35, `hsla(${p.hue},100%,55%,${alpha * 0.45})`);
        g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    resize();
    for (let i = 0; i < count; i++) { const p = {}; spawn(p, true); parts.push(p); }
    window.addEventListener("resize", resize, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop())).observe(canvas);
    } else start();
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }
})();

(async () => {
  const TEAM = await (window.REAVERS_DATA_PROMISE || Promise.resolve(window.REAVERS_DATA || {}));
  const BOS = window.BUHURTOS || null;
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const safeHref = value => {
    const href = String(value || "").trim();
    if (!href) return "#";
    if (/^(https?:|mailto:|#|[a-z0-9_.-]+\.html(?:[#?].*)?$)/i.test(href)) return href;
    return "#";
  };
  const safeImg = value => (/^(https:\/\/|assets\/)/i.test(String(value || "").trim()) ? String(value).trim() : "");
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${id}"></use></svg>`;
  const initialsOf = name => String(name || "R").split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const norm = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
  const reveal = root => window.REAVERS_REVEAL && window.REAVERS_REVEAL(root);

  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll("[data-season]").forEach(el => { el.textContent = TEAM.season || "2026"; });

  // ---------- next practice ----------
  function edmontonNow() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return new Date(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  }
  function parseClock(label) {
    const m = String(label).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return { hour: 17, minute: 0 };
    let hour = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") hour += 12;
    return { hour, minute: Number(m[2]) };
  }
  function getNextPractice() {
    const now = edmontonNow();
    const sessions = (TEAM.practice && TEAM.practice.sessions) || [];
    let best = null;
    for (const session of sessions) {
      const clock = parseClock(session.time);
      const d = new Date(now);
      const delta = (session.day - now.getDay() + 7) % 7;
      d.setDate(now.getDate() + delta);
      d.setHours(clock.hour, clock.minute, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 7);
      if (!best || d < best.date) best = { ...session, date: d };
    }
    return best;
  }
  const practice = getNextPractice();
  if (practice) {
    const dateText = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" }).format(practice.date).toUpperCase();
    document.querySelectorAll("[data-next-practice-date]").forEach(el => { el.textContent = dateText; });
    document.querySelectorAll("[data-next-practice-title]").forEach(el => { el.textContent = `${practice.label} practice`; });
    document.querySelectorAll("[data-next-practice-meta]").forEach(el => { el.textContent = `${practice.time} to ${practice.end} · ${practice.venue || TEAM.practice.venue}`; });
  }
  const sessions = TEAM.practice?.sessions || [];
  document.querySelectorAll("[data-practice-times]").forEach(el => {
    el.innerHTML = sessions.map(s => `<div class="muster-time"><span>${escapeHtml(String(s.label || "").slice(0, 3).toUpperCase())}</span><strong>${escapeHtml(s.time)}</strong><small>to ${escapeHtml(s.end)}</small></div>`).join("");
  });
  document.querySelectorAll("[data-practice-venue]").forEach(el => { el.textContent = TEAM.practice?.venue || "Springbrook Archery Centre"; });
  document.querySelectorAll("[data-practice-fee]").forEach(el => { el.textContent = TEAM.practice?.fee || "$10"; });
  document.querySelectorAll("[data-practice-count]").forEach(el => { el.textContent = sessions.length ? `${sessions.length}×` : "Weekly"; });

  // ---------- events ----------
  const shortDate = raw => {
    const [y, m, d] = String(raw || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    return { day: String(d), month: new Intl.DateTimeFormat("en-CA", { month: "short" }).format(date).toUpperCase(), long: new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date) };
  };
  const rangeText = (start, end) => {
    const parse = raw => { const [y, m, d] = String(raw || "").split("-").map(Number); return y && m && d ? new Date(y, m - 1, d) : null; };
    const a = parse(start), b = parse(end);
    if (!a) return "Date TBA";
    const md = date => new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(date);
    if (!b || end === start) return `${md(a)}, ${a.getFullYear()}`;
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${md(a)}–${b.getDate()}, ${a.getFullYear()}`;
    return a.getFullYear() === b.getFullYear() ? `${md(a)} – ${md(b)}, ${a.getFullYear()}` : `${md(a)}, ${a.getFullYear()} – ${md(b)}, ${b.getFullYear()}`;
  };

  // Every event on BuhurtOS joins the team's own calendar: upcoming ones merge into one list, past ones get their own list.
  let bosAll = [];
  let bosFailed = false;
  if (BOS && document.querySelector("[data-event-list],[data-upcoming-event],[data-past-events]")) {
    try { bosAll = await BOS.allEvents(); } catch (error) { bosFailed = true; console.warn("BuhurtOS events unavailable.", error); }
  }
  const bosUpcoming = bosAll.filter(e => !e.past);
  const bosPast = bosAll.filter(e => e.past);
  if (bosUpcoming.length) {
    const have = new Set((TEAM.events || []).map(e => `${norm(e.title)}|${e.rawDate}`));
    const added = bosUpcoming.filter(e => !have.has(`${norm(e.name)}|${e.startsOn}`)).map(e => ({
      id: `bos-${e.id}`, title: e.name, type: e.type, rawDate: e.startsOn, rawEndDate: e.endsOn && e.endsOn !== e.startsOn ? e.endsOn : "",
      rawStartTime: "", rawEndTime: "", date: rangeText(e.startsOn, e.endsOn), startTime: "", endTime: "", location: e.where,
      details: e.reavers === "entered" && e.competitions.length ? `Reavers entered: ${e.competitions.join(", ")}` : e.details, href: e.url, source: "buhurtos", reavers: e.reavers, competitions: e.competitions
    }));
    const merged = [...(TEAM.events || []), ...added].sort((a, b) => `${a.rawDate} ${a.rawStartTime || ""}`.localeCompare(`${b.rawDate} ${b.rawStartTime || ""}`));
    TEAM.events = merged;
    TEAM.upcomingEvents = merged;
  }

  function eventTeaser(event) {
    if (!event) return `<div class="hub-empty"><strong>No public event confirmed</strong><small>The next tournament or demo appears here once it is locked in.</small></div>`;
    return `<a class="hub-live" href="${escapeHtml(safeHref(event.href || "events.html"))}"><span class="hub-kicker">${escapeHtml(event.date || "Date TBA")}</span><strong>${escapeHtml(event.title || "Upcoming event")}</strong><small>${escapeHtml(event.location || "")}</small></a>`;
  }
  function resultTeaser(result) {
    if (!result) return `<div class="hub-empty"><strong>No result posted yet</strong><small>Tournament placings land here from BuhurtOS after the team competes.</small></div>`;
    return `<a class="hub-live" href="${escapeHtml(safeHref(result.href || "events.html#results"))}"><span class="hub-kicker">${escapeHtml(result.date || "Latest")}</span><strong>${escapeHtml(result.title || "Latest result")}</strong><small>${escapeHtml(result.result || "")}</small></a>`;
  }
  document.querySelectorAll("[data-upcoming-event]").forEach(el => { el.innerHTML = eventTeaser((TEAM.upcomingEvents || [])[0]); });

  const eventList = document.querySelector("[data-event-list]");
  if (eventList) {
    const events = TEAM.events || [];
    eventList.innerHTML = events.length ? events.map((event, i) => {
      const sd = shortDate(event.rawDate);
      const calendar = event.rawDate ? `<div class="event-calendar"><add-to-calendar-button
        name="${escapeHtml(event.title)}"
        description="${escapeHtml(event.details || "Red Deer Reavers event")}"
        startDate="${escapeHtml(event.rawDate)}"
        ${event.rawEndDate ? `endDate="${escapeHtml(event.rawEndDate)}"` : ""}
        ${event.rawStartTime ? `startTime="${escapeHtml(event.rawStartTime)}"` : ""}
        ${event.rawEndTime ? `endTime="${escapeHtml(event.rawEndTime)}"` : ""}
        ${event.location ? `location="${escapeHtml(event.location)}"` : ""}
        timeZone="America/Edmonton"
        options="['Apple','Google','iCal','Microsoft365','Outlook.com','Yahoo']"
        listStyle="modal"
        trigger="click"
        size="1"
        lightMode="dark"
      ></add-to-calendar-button></div>` : "";
      return `<article class="plate event-card" data-reveal data-delay="${i % 3}">
        <div class="seal" aria-hidden="true"><div><b>${escapeHtml(sd ? sd.day : "?")}</b><span>${escapeHtml(sd ? sd.month : "TBA")}</span></div></div>
        <div>
          <span class="label event-type">${escapeHtml(String(event.type || "event").replace(/_/g, " "))}</span>${event.source === "buhurtos" ? (event.reavers ? ` <span class="pennant gilt">Reavers ${event.reavers}</span>` : ` <span class="pennant ember">On BuhurtOS</span>`) : ""}
          <h3>${escapeHtml(event.title)}</h3>
          <p class="event-meta"><span>${icon("clock")}${escapeHtml(event.date)}${event.startTime ? ` · ${escapeHtml(event.startTime)}${event.endTime ? ` to ${escapeHtml(event.endTime)}` : ""}` : ""}</span>${event.location ? `<span>${icon("pin")}${escapeHtml(event.location)}</span>` : ""}</p>
          ${event.details ? `<p class="details">${escapeHtml(event.details)}</p>` : ""}
          ${event.source === "buhurtos" ? `<p class="details"><a class="text-link" href="${escapeHtml(safeHref(event.href))}" target="_blank" rel="noopener">Details on BuhurtOS ${icon("external")}</a></p>` : ""}
          ${calendar}
        </div>
      </article>`;
    }).join("") : `<div class="plate empty"><strong>No dates posted yet</strong><p>Confirmed tournaments, demos and team events appear here as soon as the team adds them.</p></div>`;
    reveal(eventList);
  }

  // ---------- past events (from BuhurtOS), newest first ----------
  const pastEl = document.querySelector("[data-past-events]");
  if (pastEl) {
    const moreRow = document.querySelector("[data-past-more-row]");
    const more = document.querySelector("[data-past-more]");
    const count = document.querySelector("[data-past-count]");
    let limit = 12;
    const pastCard = (e, i) => {
      const sd = shortDate(e.startsOn);
      const tag = e.reavers ? ` <span class="pennant gilt">Reavers ${escapeHtml(e.reavers)}</span>` : "";
      return `<a class="plate event-card event-past" href="${escapeHtml(safeHref(e.url))}" target="_blank" rel="noopener" data-reveal data-delay="${i % 3}">
        <div class="seal" aria-hidden="true"><div><b>${escapeHtml(sd ? sd.day : "?")}</b><span>${escapeHtml(sd ? sd.month : "")}</span></div></div>
        <div>
          <span class="label event-type">${escapeHtml(String(e.type || "event").replace(/_/g, " "))}</span>${tag}
          <h3>${escapeHtml(e.name)}</h3>
          <p class="event-meta"><span>${icon("clock")}${escapeHtml(rangeText(e.startsOn, e.endsOn))}</span>${e.where ? `<span>${icon("pin")}${escapeHtml(e.where)}</span>` : ""}</p>
          <span class="text-link">Results &amp; details on BuhurtOS ${icon("external")}</span>
        </div>
      </a>`;
    };
    const renderPast = () => {
      if (bosFailed) pastEl.innerHTML = `<div class="plate empty"><strong>Past events out of reach</strong><p>The event history could not be loaded from BuhurtOS just now. It will be back on the next visit.</p></div>`;
      else if (!bosPast.length) pastEl.innerHTML = `<div class="plate empty"><strong>No past events yet</strong><p>Once events have finished on BuhurtOS, they are kept here permanently, newest first.</p></div>`;
      else pastEl.innerHTML = bosPast.slice(0, limit).map(pastCard).join("");
      if (moreRow) moreRow.hidden = bosPast.length <= limit;
      if (count) count.textContent = bosPast.length ? `${Math.min(limit, bosPast.length)} of ${bosPast.length} shown` : "";
      reveal(pastEl);
    };
    more?.addEventListener("click", () => { limit += 12; renderPast(); });
    renderPast();
  }

  // ---------- proclamations (team updates) ----------
  const updatesEl = document.querySelector("[data-team-updates]");
  if (updatesEl) {
    updatesEl.innerHTML = (TEAM.updates || []).map((item, i) => `<a class="news-card" href="${escapeHtml(safeHref(item.href || "#"))}" data-reveal data-delay="${i % 3}"><span>${escapeHtml(item.tag || "Update")}</span><h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.copy || "")}</p><b>${escapeHtml(item.cta || "Read more")} →</b></a>`).join("");
    reveal(updatesEl);
  }

  // ---------- roster: BuhurtOS fighters + the team's own crew list ----------
  const siteRoster = (TEAM.roster || []).filter(m => m && m.name);
  const fighterTargets = document.querySelectorAll("[data-fighter-grid],[data-fighter-rail]");
  const needsFighters = fighterTargets.length || document.querySelector("[data-crew-grid],[data-roster-count],[data-fighter-count],[data-team-record],[data-results-list],[data-latest-result]");

  function shieldHtml(name, photo, size = "") {
    const src = safeImg(photo);
    return `<div class="shield ${size}"><div class="shield-inner">${src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">` : `<span class="initials">${escapeHtml(initialsOf(name))}</span>`}</div></div>`;
  }
  function fighterCard(f, i) {
    const disciplines = f.disciplines.slice(0, 3).map(code => `<span class="chip">${escapeHtml(BOS ? BOS.categoryName(code) : code)}</span>`).join("");
    const roleLine = [f.siteRole && norm(f.siteRole) !== "fighter" ? f.siteRole : "", f.where].filter(Boolean).join(" · ");
    return `<a class="plate fighter-card" href="${escapeHtml(f.profileUrl)}" data-reveal data-delay="${i % 4}">
      ${f.captain ? `<span class="pennant ember">Captain</span>` : f.mercenary ? `<span class="pennant steel">Mercenary</span>` : ""}
      ${shieldHtml(f.name, f.avatar || f.sitePhoto)}
      <h3>${escapeHtml(f.name)}</h3>
      ${roleLine ? `<p class="where">${escapeHtml(roleLine)}</p>` : ""}
      ${disciplines ? `<div class="chip-row">${disciplines}</div>` : ""}
      <span class="text-link go">View profile ${icon("arrow")}</span>
    </a>`;
  }
  function crewCard(m, i) {
    const experience = m.experienceYears !== null && m.experienceYears !== undefined && m.experienceYears !== "" ? `${escapeHtml(m.experienceYears)}+ ${Number(m.experienceYears) === 1 ? "year" : "years"} experience` : "";
    return `<article class="plate crew-card" data-reveal data-delay="${i % 3}">
      ${shieldHtml(m.name, m.photo, "sm")}
      <div>
        <span class="role">${escapeHtml(m.role || "Team member")}</span>
        <h3>${escapeHtml(m.name)}</h3>
        ${m.discipline || experience ? `<small>${[escapeHtml(m.discipline), experience].filter(Boolean).join(" · ")}</small>` : ""}
        ${m.affiliations ? `<small>${escapeHtml(m.affiliations)}</small>` : ""}
        ${m.experienceSummary ? `<p>${escapeHtml(m.experienceSummary)}</p>` : ""}
        ${m.bio ? `<p>${escapeHtml(m.bio)}</p>` : ""}
        ${m.isExample ? `<span class="pennant gilt sample">Sample profile</span>` : ""}
      </div>
    </article>`;
  }
  const fighterSkeletons = n => Array.from({ length: n }, () => `<div class="plate skeleton skeleton-card" aria-hidden="true"></div>`).join("");
  fighterTargets.forEach(el => { el.innerHTML = fighterSkeletons(el.hasAttribute("data-fighter-rail") ? 4 : 4); el.setAttribute("aria-busy", "true"); });

  let bosRoster = { team: null, fighters: [] };
  let bosError = null;
  if (needsFighters && BOS) {
    try { bosRoster = await BOS.teamRoster(); } catch (error) { bosError = error; console.warn("BuhurtOS roster unavailable.", error); }
  }
  const hiddenIds = new Set((TEAM.hiddenFighters || []).map(String));
  const siteByName = new Map(siteRoster.map(m => [norm(m.name), m]));
  const fighters = bosRoster.fighters.filter(f => !hiddenIds.has(String(f.id).toLowerCase())).map(f => {
    const match = siteByName.get(norm(f.name));
    return match ? { ...f, siteRole: match.role || "", sitePhoto: match.photo || "" } : f;
  });
  const fighterNames = new Set(fighters.map(f => norm(f.name)));
  const crew = siteRoster.filter(m => !fighterNames.has(norm(m.name)));

  const rosterFallback = BOS
    ? `<div class="plate empty"><strong>${bosError ? "BuhurtOS is out of reach" : "No fighter profiles yet"}</strong><p>${bosError ? "Fighter profiles could not be loaded just now. Try again shortly, or" : "Be the first: build your fighter profile on BuhurtOS and join the Red Deer Reavers, or"} <a href="${escapeHtml(BOS.links.team)}" target="_blank" rel="noopener">see the team on BuhurtOS</a>.</p></div>`
    : "";
  fighterTargets.forEach(el => {
    const limit = el.hasAttribute("data-fighter-rail") ? 8 : Infinity;
    el.innerHTML = fighters.length ? fighters.slice(0, limit).map(fighterCard).join("") : rosterFallback;
    el.removeAttribute("aria-busy");
    reveal(el);
  });

  const crewGrid = document.querySelector("[data-crew-grid]");
  if (crewGrid) {
    crewGrid.innerHTML = crew.length ? crew.map(crewCard).join("") : `<div class="plate empty"><strong>Crew profiles are coming</strong><p>Squires, organizers, media and support crew can be added from the team admin page.</p></div>`;
    reveal(crewGrid);
  }
  const crewSection = document.querySelector("[data-crew-section]");
  if (crewSection && !crew.length) crewSection.hidden = true;

  const companyCount = fighters.length + crew.filter(m => !m.isExample).length;
  // Without BuhurtOS the fighters are missing, so any count would be too low: leave the number off instead.
  const showCount = (el, n) => { el.textContent = !bosError && n ? String(n) : ""; el.hidden = !!bosError || !n; };
  document.querySelectorAll("[data-roster-count]").forEach(el => showCount(el, companyCount));
  document.querySelectorAll("[data-fighter-count]").forEach(el => showCount(el, fighters.length));

  // ---------- team record + results from BuhurtOS ----------
  const recordEl = document.querySelector("[data-team-record]");
  const resultsEl = document.querySelector("[data-results-list]");
  const latestEls = document.querySelectorAll("[data-latest-result]");
  const ordinal = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  const [stats, results] = await Promise.all([
    recordEl && BOS ? BOS.teamStats().catch(() => null) : null,
    (resultsEl || latestEls.length) && BOS ? BOS.teamResults().catch(() => null) : null
  ]);

  const latestSite = (TEAM.results || [])[0];
  const latestBos = results && results[0] ? { date: rangeText(results[0].startsOn, results[0].endsOn), title: results[0].event, result: `${ordinal(results[0].place)} · ${results[0].competition}`, href: "events.html#results" } : null;
  latestEls.forEach(el => { el.innerHTML = resultTeaser(latestSite || latestBos); });

  if (recordEl && !stats) {
    recordEl.innerHTML = `<div class="plate empty"><strong>Record out of reach</strong><p>The live company record could not be loaded from BuhurtOS just now. It will be back on the next visit.</p></div>`;
  } else if (recordEl) {
    const s = stats || { events: 0, matches: 0, wins: 0, losses: 0, draws: 0, golds: 0, silvers: 0, bronzes: 0, podiums: 0, points: 0, form: [] };
    const tile = (value, label, i) => `<div class="plate record-tile" data-reveal data-delay="${i}"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`;
    recordEl.innerHTML = `
      <div class="record-grid">
        ${tile(s.events, "Tournaments", 0)}${tile(s.matches, "Fights", 1)}${tile(`${s.wins}–${s.losses}${s.draws ? `–${s.draws}` : ""}`, s.draws ? "Won · Lost · Drawn" : "Won · Lost", 2)}${tile(s.podiums, "Podiums", 3)}
      </div>
      <div class="medals" data-reveal><span class="medal gold"><i></i>${s.golds}</span><span class="medal silver"><i></i>${s.silvers}</span><span class="medal bronze"><i></i>${s.bronzes}</span></div>
      ${s.form.length ? `<div class="form-dots" aria-label="Recent form">${s.form.map(c => `<i class="${c}">${c}</i>`).join("")}</div>` : ""}
      <p class="muted" style="text-align:center;margin:14px 0 0">${s.matches ? "Official record from BuhurtOS. Test events are never counted." : "The record starts with the team's first BuhurtOS tournament."}</p>`;
    reveal(recordEl);
  }

  if (resultsEl) {
    resultsEl.innerHTML = results && results.length
      ? results.map((r, i) => `<a class="result-row" href="${escapeHtml(r.eventUrl)}" target="_blank" rel="noopener" data-reveal data-delay="${i % 3}"><span class="place ${r.place <= 3 ? `p${r.place}` : ""}">${r.place}</span><div><strong>${escapeHtml(r.event)}</strong><small>${escapeHtml(r.competition)} · ${escapeHtml(rangeText(r.startsOn, r.endsOn))}</small></div><span class="pts">${r.points ? `${escapeHtml(r.points)} pts` : ""}</span></a>`).join("")
      : `<div class="plate empty"><strong>${results ? "No placings yet" : "Results unavailable"}</strong><p>${results ? "When the Reavers finish a tournament run on BuhurtOS, every placing is recorded here automatically." : "The tournament record could not be loaded just now."}</p></div>`;
    reveal(resultsEl);
  }

  // ---------- join form (opens the visitor's email app) ----------
  const joinForm = document.querySelector("[data-join-form]");
  joinForm?.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(joinForm);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const interest = String(data.get("interest") || "Trying a practice").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent(`Reavers inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nBest contact: ${contact}\nInterested in: ${interest}\n\n${message}`);
    window.location.href = `mailto:${TEAM.contactEmail || "reddeerreavers@gmail.com"}?subject=${subject}&body=${body}`;
  });

  // ---------- community inquiry (goes to the team admin) ----------
  const communityForm = document.querySelector("[data-community-form]");
  communityForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.querySelector("[data-community-form-status]");
    const button = communityForm.querySelector('button[type="submit"]');
    const data = new FormData(communityForm);
    const item = {
      name: String(data.get("name") || "").trim(),
      organization: String(data.get("organization") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      event_type: String(data.get("event_type") || "community_event"),
      event_date: String(data.get("event_date") || ""),
      location: String(data.get("location") || "").trim(),
      audience_size: String(data.get("audience_size") || ""),
      details: String(data.get("details") || "").trim()
    };
    const website = String(data.get("website") || "");
    if (!item.name || !item.contact) {
      if (status) status.textContent = "Please add your name and a way for us to contact you.";
      return;
    }
    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    if (status) status.textContent = "Sending your inquiry…";
    try {
      const response = await fetch(window.REAVERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "community_inquiry_submit", item, website })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not send inquiry");
      communityForm.reset();
      if (status) status.textContent = "Thank you. Your inquiry is with the Reavers now, and we will follow up using the contact you gave.";
      if (button) button.textContent = "Inquiry sent";
    } catch (error) {
      if (status) status.textContent = "We could not send that right now. You can still email reddeerreavers@gmail.com.";
      if (button) { button.disabled = false; button.textContent = "Try again"; }
    }
  });

})();

// ---------- photos synced from Instagram and Facebook (assets/social/feed.json) ----------
(async () => {
  const feedEl = document.querySelector("[data-social-feed]");
  const stripEl = document.querySelector("[data-social-strip]");
  if (!feedEl && !stripEl) return;
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${id}"></use></svg>`;
  const LABEL = { instagram: "Instagram", facebook: "Facebook" };
  const safeLink = url => (/^https:\/\/(www\.|m\.)?(instagram\.com|facebook\.com|fb\.watch)\//i.test(String(url || "")) ? String(url) : "");
  const safeSrc = src => (/^assets\/social\/[\w.-]+\.webp$/.test(String(src || "")) ? src : "");
  const dateText = raw => { const d = new Date(raw); return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(d); };

  let posts = [];
  try {
    const response = await fetch("assets/social/feed.json", { cache: "no-cache" });
    if (response.ok) posts = ((await response.json()).posts || []).filter(p => p && LABEL[p.source] && Array.isArray(p.images) && p.images.length);
  } catch (error) { console.warn("Social feed unavailable.", error); }

  const imageTag = (img, sizes) => {
    const s = img.sizes || {};
    const main = s[720] || s[360] || s[1200];
    if (!main || !safeSrc(main.src)) return "";
    const srcset = [360, 720, 1200].map(w => s[w] && safeSrc(s[w].src) ? `${s[w].src} ${s[w].width}w` : "").filter(Boolean).join(", ");
    return `<img src="${escapeHtml(main.src)}" srcset="${escapeHtml(srcset)}" sizes="${sizes}" width="${Number(main.width) || 720}" height="${Number(main.height) || 720}" alt="${escapeHtml(img.alt || "Red Deer Reavers photo")}" loading="lazy" decoding="async">`;
  };
  const postCard = (p, i, compact) => {
    const link = safeLink(p.url);
    const tag = link ? "a" : "article";
    const media = imageTag(p.images[0], compact ? "(max-width: 759px) 50vw, 200px" : "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 380px");
    if (!media) return "";
    const caption = String(p.caption || "").replace(/\s+/g, " ").trim();
    const short = caption.length > 170 ? `${caption.slice(0, 167).trim()}…` : caption;
    return `<${tag} class="${compact ? "strip-card" : "plate post-card"} is-${p.source}"${link ? ` href="${escapeHtml(link)}" target="_blank" rel="noopener"` : ""} data-source="${p.source}" data-reveal data-delay="${i % 3}">
      <figure class="post-media">${media}${p.images.length > 1 ? `<span class="post-count">${icon("frame")}${p.images.length}<span class="sr-only"> photos</span></span>` : ""}${p.video ? `<span class="post-play"><span class="sr-only">Video</span></span>` : ""}</figure>
      ${compact ? `<span class="strip-source">${icon(p.source)}<span class="sr-only">${LABEL[p.source]}</span></span>` : `<div class="post-body"><div class="post-meta"><span class="post-source">${icon(p.source)}${LABEL[p.source]}</span><time datetime="${escapeHtml(p.date)}">${escapeHtml(dateText(p.date))}</time></div>${short ? `<p>${escapeHtml(short)}</p>` : ""}${link ? `<span class="text-link">Open post ${icon("external")}</span>` : ""}</div>`}
    </${tag}>`;
  };
  const reveal = root => window.REAVERS_REVEAL && window.REAVERS_REVEAL(root);

  if (stripEl) {
    const section = stripEl.closest("[data-social-strip-section]");
    if (posts.length) {
      stripEl.innerHTML = posts.slice(0, 6).map((p, i) => postCard(p, i, true)).join("");
      if (section) section.hidden = false;
      reveal(stripEl);
    }
  }

  if (feedEl) {
    const filters = document.querySelector("[data-feed-filters]");
    const moreRow = document.querySelector("[data-feed-more-row]");
    const more = document.querySelector("[data-feed-more]");
    let source = "all";
    let limit = 12;
    const render = () => {
      const list = posts.filter(p => source === "all" || p.source === source);
      feedEl.innerHTML = list.length
        ? list.slice(0, limit).map((p, i) => postCard(p, i, false)).join("")
        : `<div class="plate empty"><strong>${posts.length ? `Nothing from ${escapeHtml(LABEL[source] || "there")} yet` : "Fresh posts are on the way"}</strong><p>The newest photos from our Instagram and Facebook appear here automatically. Until then, follow along on <a href="https://www.instagram.com/red_deer_reavers/" target="_blank" rel="noopener">Instagram</a> and <a href="https://www.facebook.com/share/1BZE4wGtyz/" target="_blank" rel="noopener">Facebook</a>.</p></div>`;
      if (moreRow) moreRow.hidden = list.length <= limit;
      reveal(feedEl);
    };
    if (filters && posts.length) {
      filters.hidden = false;
      const present = new Set(posts.map(p => p.source));
      filters.querySelectorAll("[data-feed-filter]").forEach(btn => {
        if (btn.dataset.feedFilter !== "all" && !present.has(btn.dataset.feedFilter)) btn.hidden = true;
        btn.addEventListener("click", () => {
          source = btn.dataset.feedFilter;
          limit = 12;
          filters.querySelectorAll("[data-feed-filter]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
          render();
        });
      });
    }
    more?.addEventListener("click", () => { limit += 12; render(); });
    render();
  }
})();

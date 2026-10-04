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
    const register = () => navigator.serviceWorker.register("sw.js?v=20", { updateViaCache: "none" }).then(registration => registration.update()).catch(() => {});
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
          <span class="label event-type">${escapeHtml(String(event.type || "event").replace(/_/g, " "))}</span>
          <h3>${escapeHtml(event.title)}</h3>
          <p class="event-meta"><span>${icon("clock")}${escapeHtml(event.date)}${event.startTime ? ` · ${escapeHtml(event.startTime)}${event.endTime ? ` to ${escapeHtml(event.endTime)}` : ""}` : ""}</span>${event.location ? `<span>${icon("pin")}${escapeHtml(event.location)}</span>` : ""}</p>
          ${event.details ? `<p class="details">${escapeHtml(event.details)}</p>` : ""}
          ${calendar}
        </div>
      </article>`;
    }).join("") : `<div class="plate empty"><strong>No dates posted yet</strong><p>Confirmed tournaments, demos and team events appear here as soon as the team adds them.</p></div>`;
    reveal(eventList);
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
  const needsFighters = fighterTargets.length || document.querySelector("[data-crew-grid],[data-roster-count],[data-fighter-count],[data-team-record],[data-results-list],[data-entry-list],[data-latest-result]");

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
  const siteByName = new Map(siteRoster.map(m => [norm(m.name), m]));
  const fighters = bosRoster.fighters.map(f => {
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
  document.querySelectorAll("[data-roster-count]").forEach(el => { el.textContent = companyCount ? String(companyCount) : "—"; });
  document.querySelectorAll("[data-fighter-count]").forEach(el => { el.textContent = fighters.length ? String(fighters.length) : "—"; });

  // ---------- team record + results from BuhurtOS ----------
  const recordEl = document.querySelector("[data-team-record]");
  const resultsEl = document.querySelector("[data-results-list]");
  const entriesEl = document.querySelector("[data-entry-list]");
  const latestEls = document.querySelectorAll("[data-latest-result]");
  const ordinal = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  const [stats, results, entries] = await Promise.all([
    recordEl && BOS ? BOS.teamStats().catch(() => null) : null,
    (resultsEl || latestEls.length) && BOS ? BOS.teamResults().catch(() => null) : null,
    entriesEl && BOS ? BOS.teamEntries().catch(() => null) : null
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

  if (entriesEl) {
    if (entries && entries.length) {
      entriesEl.innerHTML = entries.map((e, i) => {
        const sd = shortDate(e.startsOn);
        return `<a class="plate event-card" href="${escapeHtml(e.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none" data-reveal data-delay="${i % 3}">
          <div class="seal" aria-hidden="true"><div><b>${escapeHtml(sd ? sd.day : "?")}</b><span>${escapeHtml(sd ? sd.month : "TBA")}</span></div></div>
          <div><span class="label event-type">Entered on BuhurtOS</span><h3>${escapeHtml(e.name)}</h3>
          <p class="event-meta"><span>${icon("clock")}${escapeHtml(rangeText(e.startsOn, e.endsOn))}</span>${e.where ? `<span>${icon("pin")}${escapeHtml(e.where)}</span>` : ""}</p>
          ${e.competitions.length ? `<div class="chip-row">${e.competitions.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join("")}</div>` : ""}</div>
        </a>`;
      }).join("");
      reveal(entriesEl);
    } else {
      const wrap = entriesEl.closest("[data-entry-section]");
      if (wrap) wrap.hidden = true;
    }
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

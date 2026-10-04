(async () => {
  const root = document.querySelector("[data-fighter-profile]");
  if (!root) return;
  const BOS = window.BUHURTOS;
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${id}"></use></svg>`;
  const initialsOf = name => String(name || "R").split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const ordinal = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const longDate = raw => {
    const [y, m, d] = String(raw || "").split("-").map(Number);
    if (!y || !m || !d) return "";
    return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(y, m - 1, d));
  };
  const SOCIAL = { instagram: ["Instagram", "instagram"], facebook: ["Facebook", "facebook"], youtube: ["YouTube", "youtube"], tiktok: ["TikTok", "link"], x: ["X", "link"], discord: ["Discord", "link"], twitch: ["Twitch", "link"], other: ["Website", "link"] };

  const id = new URLSearchParams(window.location.search).get("id") || "";
  const state = (title, body, actions = "") => {
    root.innerHTML = `<section class="fighter-hero"><div class="shell"><div class="shield lg" style="margin:0 auto 18px"><div class="shield-inner"><span class="initials">?</span></div></div><h1>${escapeHtml(title)}</h1><p class="lede" style="margin:0 auto">${body}</p><div class="btn-row">${actions}</div></div></section>`;
  };

  if (!BOS || !BOS.isId(id)) {
    state("Fighter not found", "That link does not point at a fighter profile. Browse the company instead.", `<a class="btn btn-ember" href="team.html">Meet the fighters</a>`);
    return;
  }

  let f = null;
  try { f = await BOS.fighter(id); }
  catch (error) {
    console.warn("BuhurtOS fighter unavailable.", error);
    state("Out of reach", "This fighter's profile could not be loaded from BuhurtOS just now. Try again shortly.", `<a class="btn btn-ember" href="${escapeHtml(BOS.links.fighter(id))}" target="_blank" rel="noopener">Open on BuhurtOS</a><a class="btn" href="team.html">Back to the team</a>`);
    return;
  }
  if (!f) {
    state("Fighter not found", "No fighter with this profile exists on BuhurtOS.", `<a class="btn btn-ember" href="team.html">Meet the fighters</a>`);
    return;
  }

  document.title = `${f.name} | Red Deer Reavers`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", `${f.name}${f.team ? `, ${f.team.name}` : ""}: fighter profile, record and tournament history.`);

  const c = f.career;
  const disciplines = f.disciplines.map(code => `<span class="chip">${escapeHtml(BOS.categoryName(code))}</span>`).join("");
  const metaBits = [
    f.team ? `<span>${icon("shield")}${f.team.isReavers ? "Red Deer Reavers" : escapeHtml(f.team.name)}</span>` : "",
    f.where ? `<span>${icon("pin")}${escapeHtml(f.where)}</span>` : "",
    f.joinedYear ? `<span>${icon("swords")}Fighting since ${escapeHtml(f.joinedYear)}</span>` : ""
  ].filter(Boolean).join("");
  const tile = (value, label) => `<div class="plate record-tile"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`;
  const socials = Object.entries(f.socials || {})
    .filter(([, url]) => /^https:\/\//i.test(String(url || "")))
    .map(([network, url]) => {
      const [label, glyph] = SOCIAL[network] || [network, "link"];
      return `<a class="social-link" href="${escapeHtml(url)}" target="_blank" rel="noopener nofollow">${icon(glyph)}${escapeHtml(label)}</a>`;
    }).join("");
  const history = f.history.length
    ? f.history.map(r => `<a class="result-row" href="${escapeHtml(r.eventUrl)}" target="_blank" rel="noopener"><span class="place ${r.place <= 3 ? `p${r.place}` : ""}">${r.place}</span><div><strong>${escapeHtml(r.event)}</strong><small>${escapeHtml(r.competition)} · ${escapeHtml(longDate(r.endsOn || r.startsOn))}</small></div><span class="pts">${r.points ? `${escapeHtml(r.points)} pts` : ordinal(r.place)}</span></a>`).join("")
    : `<div class="plate empty"><strong>No placings yet</strong><p>Tournament placings appear here automatically once ${escapeHtml(f.name.split(" ")[0])} competes at an event run on BuhurtOS.</p></div>`;

  root.innerHTML = `
    <section class="fighter-hero">
      <div class="hero-media" aria-hidden="true"><img src="assets/generated/gallery/image-16-1200.webp" alt="" decoding="async"></div>
      <div class="shell">
        ${f.synthetic ? `<p class="test-banner">Test profile · not an official record</p>` : ""}
        <div class="shield lg"><div class="shield-inner">${f.avatar ? `<img src="${escapeHtml(f.avatar)}" alt="${escapeHtml(f.name)}" decoding="async">` : `<span class="initials">${escapeHtml(initialsOf(f.name))}</span>`}</div></div>
        <p class="eyebrow">${f.team && f.team.isReavers ? "Sworn to the Reavers" : "Fighter profile"}</p>
        <h1>${escapeHtml(f.name)}</h1>
        ${metaBits ? `<p class="meta">${metaBits}</p>` : ""}
        ${disciplines ? `<div class="chip-row">${disciplines}</div>` : ""}
        <div class="btn-row">
          <a class="btn btn-ember" href="${escapeHtml(f.buhurtosUrl)}" target="_blank" rel="noopener">Full record on BuhurtOS ${icon("external")}</a>
          <a class="btn" href="team.html">${icon("shield")} The company</a>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="shell">
        <div class="stat-grid" data-reveal>
          ${tile(c.events, "Tournaments")}
          ${tile(c.matches, "Fights")}
          ${tile(c.wins, "Wins")}
          ${tile(c.podiums, "Podiums")}
          ${tile(c.victories, "Titles")}
          ${tile(c.points, "Ranking points")}
        </div>
        <div class="medals" data-reveal><span class="medal gold"><i></i>${c.golds}</span><span class="medal silver"><i></i>${c.silvers}</span><span class="medal bronze"><i></i>${c.bronzes}</span></div>
      </div>
    </section>

    <section class="section-tight">
      <div class="shell fighter-layout">
        <div style="display:grid;gap:18px">
          ${f.bio || f.style ? `<article class="parchment bio-card" data-reveal>
            <p class="eyebrow">In their words</p>
            ${f.bio ? `<p class="illuminated">${escapeHtml(f.bio)}</p>` : ""}
            ${f.style ? `<p style="margin:0"><strong>Fighting style:</strong> ${escapeHtml(f.style)}</p>` : ""}
          </article>` : ""}
          <div id="results">
            <div class="section-head" style="margin-bottom:16px"><p class="eyebrow">Tournament record</p><h2 style="font-size:clamp(2rem,6vw,3rem)">Placings</h2></div>
            <div class="results-list">${history}</div>
          </div>
        </div>
        <aside style="display:grid;gap:18px">
          ${f.highlights.length ? `<div class="plate" data-reveal><p class="eyebrow">Deeds &amp; honours</p><ul class="highlights">${f.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}</ul></div>` : ""}
          ${socials ? `<div class="plate" data-reveal><p class="eyebrow">Follow</p><div class="socials">${socials}</div></div>` : ""}
          <div class="plate plate-royal" data-reveal>
            <p class="eyebrow">Is this you?</p>
            <p class="muted" style="margin-bottom:14px">This profile lives on BuhurtOS. Sign in there to add a photo, your disciplines, a bio and your socials. Changes show here automatically.</p>
            <a class="btn btn-gilt btn-block" href="${escapeHtml(BOS.links.account)}" target="_blank" rel="noopener">Update my profile ${icon("external")}</a>
          </div>
          <div class="source-note">${icon("scroll")}<p>Record kept by <a href="${escapeHtml(BOS.links.home)}" target="_blank" rel="noopener">BuhurtOS</a>, the permanent record for buhurt fighters and events. Only finished, official tournaments count. Test events are never included.</p></div>
        </aside>
      </div>
    </section>`;
  if (window.REAVERS_REVEAL) window.REAVERS_REVEAL(root);
})();

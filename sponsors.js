/*
 * Sponsors page: the sponsor wall and the "Become a sponsor" form.
 * Sponsors are managed in the Reavers app (Sponsors → Website). The wall shows signed sponsors switched on there, through
 * public.reavers_sponsors_public(), which returns only names, tiers, links, logos and a short line. The form calls
 * public.reavers_sponsor_inquiry(), which adds the business to the app's sponsor pipeline and Inquiries page.
 */
(() => {
  const backend = window.REAVERS_BACKEND;
  const rpc = async (fn, body) => {
    if (!backend) throw new Error("Backend not configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${backend.url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        cache: "no-store",
        headers: { apikey: backend.key, Authorization: `Bearer ${backend.key}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(payload.message || `Request failed (${response.status})`), { code: payload.code, status: response.status });
      return payload;
    } finally { clearTimeout(timer); }
  };
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  const safeUrl = (url, schemes = /^https?:\/\//i) => (schemes.test(String(url || "")) ? String(url) : "");
  const TIERS = ["Gold", "Silver", "Bronze", "In-kind"];

  // ---------- sponsor wall ----------
  const wall = document.querySelector("[data-sponsor-wall]");
  const empty = `<div class="plate empty sponsor-empty"><strong>Your logo here</strong><p>This season's sponsor wall is open. Be the first business to back the Reavers.</p><a class="btn btn-ember btn-sm" href="#become">Become a sponsor</a></div>`;
  const card = s => {
    const site = safeUrl(s.website);
    const logo = safeUrl(s.logo_url, /^https:\/\//i);
    const inner = `${logo ? `<img src="${esc(logo)}" alt="${esc(s.name)}" loading="lazy" decoding="async">` : `<span class="sponsor-name">${esc(s.name)}</span>`}
      ${logo ? `<strong class="sr-only">${esc(s.name)}</strong>` : ""}${s.blurb ? `<small>${esc(s.blurb)}</small>` : ""}`;
    return site
      ? `<a class="sponsor-card" href="${esc(site)}" target="_blank" rel="noopener sponsored" title="${esc(s.name)}">${inner}</a>`
      : `<div class="sponsor-card" title="${esc(s.name)}">${inner}</div>`;
  };
  const render = list => {
    if (!wall) return;
    if (!list.length) { wall.innerHTML = empty; return; }
    const groups = [...TIERS, ""].map(tier => ({
      tier,
      items: list.filter(s => (tier ? s.tier === tier || (tier === "In-kind" && !TIERS.includes(s.tier) && s.in_kind) : !TIERS.includes(s.tier) && !s.in_kind))
    })).filter(g => g.items.length);
    wall.innerHTML = groups.map(g => `
      <div class="sponsor-tier sponsor-tier-${esc((g.tier || "partner").toLowerCase())}">
        <h3 class="label">${g.tier ? `${esc(g.tier)} sponsors` : "Partners"}</h3>
        <div class="sponsor-grid">${g.items.map(card).join("")}</div>
      </div>`).join("");
  };
  if (wall) {
    rpc("reavers_sponsors_public")
      .then(list => render(Array.isArray(list) ? list.filter(s => s && s.name) : []))
      .catch(error => {
        console.warn("Sponsors unavailable.", error);
        wall.innerHTML = empty;
      });
  }

  // ---------- tier buttons pick the tier in the form ----------
  const form = document.querySelector("[data-sponsor-form]");
  document.querySelectorAll("[data-pick-tier]").forEach(link => link.addEventListener("click", () => {
    const select = form?.querySelector('select[name="tier"]');
    if (select) select.value = link.getAttribute("data-pick-tier") || "";
  }));

  // ---------- become a sponsor ----------
  form?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.querySelector("[data-sponsor-form-status]");
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const get = key => String(data.get(key) || "").trim();
    const body = {
      name: get("name"), contact_name: get("contact_name"), email: get("email"), phone: get("phone"),
      website: get("business_site"), tier: get("tier"), message: get("message"), trap: get("website")
    };
    const say = text => { if (status) status.textContent = text; };
    if (!body.name) { say("Please add the name of your business or organization."); form.querySelector('[name="name"]')?.focus(); return; }
    if (!body.email && !body.phone) { say("Please add an email or phone number so we can reply."); form.querySelector('[name="email"]')?.focus(); return; }
    if (body.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) { say("That email address does not look right."); form.querySelector('[name="email"]')?.focus(); return; }
    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    say("Sending…");
    try {
      await rpc("reavers_sponsor_inquiry", { p: body });
      form.reset();
      say("Thank you! Your message is with the Reavers organizers, and we'll be in touch within a few days.");
      if (button) button.textContent = "Sent";
    } catch (error) {
      // The database answers bad input in plain words (code 22023); anything else gets the email fallback.
      say(error.code === "22023" || error.code === "53400" ? error.message : "We could not send that right now. You can email reddeerreavers@gmail.com instead.");
      if (button) { button.disabled = false; button.textContent = "Try again"; }
    }
  });
})();

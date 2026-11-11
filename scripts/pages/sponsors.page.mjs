import { head, header, footer, dock, scripts, photo, icon, V } from "./partials.mjs";

// The sponsors on this page come from the Reavers app (Sponsors → Website): signed sponsors switched on, with their logo.
// The tiers match the About page. The form adds the business to the app's sponsor pipeline and Inquiries page.
const TIERS = [
  { name: "Gold", price: "$1,000+", tone: "gold", perks: ["Logo on all event materials, banners and tabards", "Logo and link at the top of this page", "Featured posts on Instagram and Facebook", "Named at every event we host"] },
  { name: "Silver", price: "$500+", tone: "silver", perks: ["Logo and link on this page", "Sponsor posts on Instagram and Facebook", "Thanked at our events"] },
  { name: "Bronze", price: "$250+", tone: "bronze", perks: ["Your name on this page", "A thank-you post on our social media"] },
  { name: "In-kind", price: "Goods or services", tone: "kind", perks: ["Gear, venue time, printing, food, travel or trades", "Recognized at the tier it is worth", "Ask us what the team needs most this season"] }
];

export const file = "sponsors.html";
export default () => `${head({
  title: "Sponsors | Red Deer Reavers",
  description: "Sponsor the Red Deer Reavers, Central Alberta's armoured combat team. Gold, Silver, Bronze and in-kind sponsorships, and the local businesses who back us.",
  page: "sponsors",
  ogImage: 14,
  extra: `\n  <link rel="stylesheet" href="sponsors.css?v=${V}">`
})}${header("", { cta: ["#become", "Sponsor us"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(14, "", { eager: true, pos: "50% 30%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Sponsors &amp; partners</p>
      <h1>Back the Steel</h1>
      <p class="lede">The Reavers are a volunteer-run nonprofit. Sponsors put loaner armour on new fighters, get the team to tournaments, and bring live armoured combat to schools and festivals across Central Alberta.</p>
      <div class="btn-row" style="margin-top:22px">
        <a class="btn btn-ember" href="#become">${icon("horn")} Become a sponsor</a>
        <a class="btn" href="#tiers">See the tiers</a>
      </div>
    </div>
  </section>

  <section class="section" id="our-sponsors" aria-labelledby="sponsors-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">With thanks to</p>
        <h2 id="sponsors-title">Our sponsors</h2>
        <p class="lede">The local businesses and partners who stand behind the Reavers this season.</p>
      </div>
      <div class="sponsor-wall" data-sponsor-wall aria-live="polite">
        <p class="muted sponsor-loading">Loading our sponsors…</p>
      </div>
    </div>
  </section>

  <section class="section parchment" id="tiers" aria-labelledby="tiers-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Sponsorship tiers</p>
        <h2 id="tiers-title">Pick your place on the banner</h2>
        <p class="lede">Every sponsorship runs for a season. We can shape a package around an event, a youth program or new-fighter gear too.</p>
      </div>
      <div class="tier-grid">
${TIERS.map((t, i) => `        <article class="tier tier-${t.tone}" data-reveal${i ? ` data-delay="${i}"` : ""}>
          <p class="label">${t.name}</p>
          <h3>${t.price}</h3>
          <ul>${t.perks.map(p => `<li>${p}</li>`).join("")}</ul>
          <a class="btn btn-sm" href="#become" data-pick-tier="${t.name}">Choose ${t.name}</a>
        </article>`).join("\n")}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="why-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">Why the Reavers</p><h2 id="why-title">Hard to miss</h2></div>
        <p class="lede">Full-contact fighting in steel draws a crowd. Your name goes where the team goes: on the list at tournaments, at community demos, and in the photos and videos people share afterwards.</p>
      </div>
      <div class="option-grid three">
        <article class="plate option featured rivets" data-reveal><span class="numeral">I</span><div><p class="label">Events</p><h3>On the field</h3><p>Banners and tabards at the tournaments we enter and host, and at demos in schools, markets and festivals.</p></div></article>
        <article class="plate option" data-reveal data-delay="1"><span class="numeral">II</span><div><p class="label">Online</p><h3>On our channels</h3><p>Sponsor posts on Instagram and Facebook, and your logo and link on this page all season.</p></div></article>
        <article class="plate option" data-reveal data-delay="2"><span class="numeral">III</span><div><p class="label">Local</p><h3>In the community</h3><p>A registered nonprofit in Red Deer. Your support goes straight to gear, travel, venue time and outreach.</p></div></article>
      </div>
    </div>
  </section>

  <section class="call" id="become" style="text-align:left" aria-labelledby="become-title">
    <div class="call-media" aria-hidden="true">${photo(10, "")}</div>
    <div class="shell book-grid">
      <div>
        <p class="eyebrow">Become a sponsor</p>
        <h2 id="become-title">Join the shield wall</h2>
        <p class="lede" style="margin:0 0 18px">Tell us a little about your business and what you have in mind. A Reavers organizer will get back to you within a few days. Nothing is final until we agree on the details together.</p>
        <img class="sponsor-crest" src="assets/reavers-logo-transparent.png" alt="Red Deer Reavers logo" width="220" height="220" decoding="async">
      </div>
      <form class="plate form" data-sponsor-form novalidate>
        <label>Business or organization<input type="text" name="name" autocomplete="organization" required maxlength="160"></label>
        <div class="form-row">
          <label>Your name<input type="text" name="contact_name" autocomplete="name" maxlength="120"></label>
          <label>Tier you're interested in
            <select name="tier">
              <option value="">Not sure yet</option>
              ${TIERS.map(t => `<option value="${t.name}">${t.name} · ${t.price}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="form-row">
          <label>Email<input type="email" name="email" autocomplete="email" maxlength="200"></label>
          <label>Phone<input type="tel" name="phone" autocomplete="tel" maxlength="40"></label>
        </div>
        <label>Your website, optional<input type="text" name="business_site" inputmode="url" autocomplete="url" maxlength="300" placeholder="yourbusiness.ca"></label>
        <label>Anything else?<textarea name="message" rows="4" maxlength="3000" placeholder="What you'd like to support, an event you have in mind, or goods and services you could offer."></textarea></label>
        <label class="website-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <button class="btn btn-ember btn-block" type="submit">Send</button>
        <p class="form-status" data-sponsor-form-status aria-live="polite">Goes straight to the Reavers organizers. We never share your details.</p>
      </form>
    </div>
  </section>
</main>
${footer()}${dock("")}${scripts(`<script src="sponsors.js?v=${V}" defer></script>`)}`;

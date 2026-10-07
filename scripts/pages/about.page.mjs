import { head, header, footer, dock, scripts, photo, icon, rule } from "./partials.mjs";

export const file = "about.html";
export default () => `${head({
  title: "About the Guild | Red Deer Reavers",
  description: "The Red Deer Reavers Guild: a registered nonprofit for historical armoured combat in Central Alberta. Our roadmap, membership, volunteering and sponsorship.",
  page: "about",
  ogImage: 14
})}${header("about", { cta: ["members.html", "Members"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(14, "", { eager: true, pos: "50% 30%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Red Deer Reavers Guild</p>
      <h1>The Guild</h1>
      <p class="lede">A registered nonprofit society bringing historical armoured combat to Central Alberta: training fighters, running events and building the sport.</p>
      <div class="btn-row" style="margin-top:22px">
        <a class="btn btn-ember" href="training.html#start">${icon("swords")} Join a practice</a>
        <a class="btn" href="members.html">Members area</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="road-title">
    <div class="shell">
      <div class="section-head"><p class="eyebrow">Our roadmap</p><h2 id="road-title">Where we are going</h2><p class="lede">Each phase is a set of milestones that brings the guild closer to a permanent home for buhurt in Alberta.</p></div>
      <ol class="roadmap">
        <li><span class="when">2023</span><h3>Foundation</h3><p>Incorporation, initial fundraising, and participation in the World Tournament. The legal foundation, first partnerships and readiness for major events.</p></li>
        <li><span class="when">2024</span><h3>Growth</h3><p>Regional tournaments and youth programs. Engaging the community through events, youth development and regional involvement.</p></li>
        <li><span class="when">2025</span><h3>Leadership</h3><p>A training facility and provincial leadership: a centralized training hub and mentoring new leaders.</p></li>
        <li><span class="when">2026–2027</span><h3>National recognition</h3><p>Hosting Canadian championships and building a strong competitive presence across the country.</p></li>
        <li><span class="when">2028–2030</span><h3>Legacy</h3><p>A permanent buhurt arena and international tournaments: Alberta as a hub for historical armoured combat.</p></li>
      </ol>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="join-title">
    <div class="shell">
      <div class="section-head"><p class="eyebrow">Be part of it</p><h2 id="join-title">Membership, volunteering, sponsorship</h2></div>
      <div class="cards-3">
        <div class="sheet-plate"><h3>Members</h3><p>Members get discounted gear and training, early access to events and tournaments, a vote at the AGM, and a say in where buhurt in Alberta goes next.</p><a class="btn btn-royal btn-sm" href="members.html">Create an account</a></div>
        <div class="sheet-plate"><h3>Volunteers</h3><p>Help run events and tournaments, or mentor young fighters in the youth program. No armour required.</p><a class="btn btn-ink btn-sm" href="community.html#book">Get in touch</a></div>
        <div class="sheet-plate"><h3>Sponsors</h3><p><strong>Gold $1,000+</strong>: logo on all event materials, the website and social media. <strong>Silver $500+</strong>: website and social media. <strong>Bronze $250+</strong>: recognition on social media.</p><a class="btn btn-gilt btn-sm" href="mailto:reddeerreavers@gmail.com">Sponsor the Reavers</a></div>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="gov-title">
    <div class="shell">
      <div class="section-head"><p class="eyebrow">Governance</p><h2 id="gov-title">How the guild runs</h2></div>
      <p class="lede">The Red Deer Reavers Guild is a registered society with elected officers, bylaws and an annual general meeting. Members vote; the executive keeps the records.</p>
      <div class="btn-row" style="margin-top:18px"><a class="btn" href="agm.html">AGM 2026</a><a class="btn" href="https://drive.google.com/file/d/1R9EDu7BpUZ1KM790BDNN0iIaXZYtUtCE/view?usp=drivesdk" target="_blank" rel="noopener">Bylaws (PDF)</a></div>
    </div>
  </section>
</main>
${footer()}${dock("about")}${scripts()}`;

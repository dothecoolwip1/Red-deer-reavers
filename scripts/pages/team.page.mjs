import { head, header, footer, dock, scripts, photo, icon } from "./partials.mjs";

export const file = "team.html";
export default () => `${head({
  title: "Team | Red Deer Reavers",
  description: "Meet the Red Deer Reavers: fighter profiles and records live from BuhurtOS, plus the crew and leadership behind the team. Add your own fighter profile in minutes.",
  page: "team",
  ogImage: 13
})}${header("team")}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(13, "", { eager: true, pos: "50% 30%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow"><span data-season>2026</span> company</p>
      <h1>The Company</h1>
      <p class="lede">The fighters who carry the banner, and the crew who keep them in the fight.</p>
      <div class="btn-row" style="margin-top:22px">
        <a class="btn btn-ember" href="#fighters">${icon("shield")} The fighters</a>
        <a class="btn" href="#add-profile">${icon("quill")} Add your profile</a>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="record-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Company record</p>
        <h2 id="record-title">Honours of the Reavers</h2>
      </div>
      <div data-team-record>
        <div class="record-grid"><div class="plate skeleton" style="height:96px"></div><div class="plate skeleton" style="height:96px"></div><div class="plate skeleton" style="height:96px"></div><div class="plate skeleton" style="height:96px"></div></div>
      </div>
    </div>
  </section>

  <section class="section" id="fighters" aria-labelledby="fighters-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">The fighters</p><h2 id="fighters-title">Sworn to the banner</h2></div>
        <p class="lede">Profiles come straight from BuhurtOS, the permanent record for buhurt fighters. Tap a fighter for their disciplines, record and tournament history.</p>
      </div>
      <div class="fighter-grid" data-fighter-grid></div>
    </div>
  </section>

  <section class="section parchment" id="add-profile" aria-labelledby="add-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Fight with the Reavers?</p>
        <h2 id="add-title">Add your fighter profile</h2>
        <p class="lede">Your profile lives on BuhurtOS and follows you to every tournament. Once the captain approves you, it appears on this page automatically, record and all.</p>
      </div>
      <div class="steps">
        <article class="step" data-reveal><span class="step-num">I</span><div><h3>Sign in to BuhurtOS</h3><p>Use Google or your email. It takes a minute and it is free.</p></div></article>
        <article class="step" data-reveal data-delay="1"><span class="step-num">II</span><div><h3>Ask to join the Reavers</h3><p>Pick the Red Deer Reavers. The captain gets a notice and approves you.</p></div></article>
        <article class="step" data-reveal data-delay="2"><span class="step-num">III</span><div><h3>Forge your profile</h3><p>Add a photo, your disciplines, a short bio and your socials. Results fill in as you compete.</p></div></article>
      </div>
      <div class="btn-row" style="justify-content:center;margin-top:34px">
        <a class="btn btn-ember" data-bos-link="join" href="https://buhurtos.ca/team-manager?join=red-deer-reavers" target="_blank" rel="noopener">${icon("quill")} Create my profile ${icon("external")}</a>
        <a class="btn btn-ink" data-bos-link="claim" href="https://buhurtos.ca/claim-profile" target="_blank" rel="noopener">My name is already listed</a>
        <a class="btn btn-ink" data-bos-link="account" href="https://buhurtos.ca/account" target="_blank" rel="noopener">Edit my profile</a>
      </div>
      <p class="muted" style="text-align:center;margin:22px auto 0;max-width:60ch">Already on the roster but never signed in? The captain may have added you. Use “My name is already listed” to claim that profile and keep its history. Only your name, photo and the details you choose are shown publicly.</p>
    </div>
  </section>

  <section class="section" data-crew-section aria-labelledby="crew-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">Crew &amp; leadership</p><h2 id="crew-title">Beyond the list</h2></div>
        <p class="lede">Squires, organizers, coaches and support crew who choose to be featured. Public profiles are always optional.</p>
      </div>
      <div class="crew-grid" data-crew-grid></div>
    </div>
  </section>

  <section class="section" style="padding-top:0" aria-labelledby="roles-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Team roles</p>
        <h2 id="roles-title">More than one way to be a Reaver</h2>
        <p class="lede">Buhurt needs people inside the armour and people around it. A strong team makes both visible.</p>
      </div>
      <div class="card-grid four">
        <article class="plate info-card" data-reveal>${icon("helm", "icon sigil-icon")}<span class="label">In the list</span><h3>Fighters</h3><p>Train for melee, duels, demonstrations and competition.</p></article>
        <article class="plate info-card" data-reveal data-delay="1">${icon("shield", "icon sigil-icon")}<span class="label">On the rail</span><h3>Squires</h3><p>Armour, hydration, repairs and timing to keep fighters in it all tournament day.</p></article>
        <article class="plate info-card" data-reveal data-delay="2">${icon("scroll", "icon sigil-icon")}<span class="label">Team ops</span><h3>Organizers</h3><p>Practices, events, travel, fundraising and keeping the club moving.</p></article>
        <article class="plate info-card" data-reveal data-delay="3">${icon("frame", "icon sigil-icon")}<span class="label">Community</span><h3>Media &amp; support</h3><p>Photography, video, demos, sponsors, volunteers and outreach.</p></article>
      </div>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="code-title">
    <div class="shell lore-grid">
      <div data-reveal>
        <p class="eyebrow">Team culture</p>
        <h2 id="code-title">The Reaver’s code</h2>
        <p class="lede">Competitive without being miserable to be around. Standards in training, and standards in how we treat each other.</p>
      </div>
      <div class="code-list">
        <article class="code-item" data-reveal><span class="numeral">I</span><div><h3>Team before ego</h3><p>Melee rewards people who do the job the team needs.</p></div></article>
        <article class="code-item" data-reveal data-delay="1"><span class="numeral">II</span><div><h3>Progress honestly</h3><p>Skills, conditioning, contact, armour and competition, all in the right order.</p></div></article>
        <article class="code-item" data-reveal data-delay="2"><span class="numeral">III</span><div><h3>Keep showing up</h3><p>Consistency matters more than looking impressive at one practice.</p></div></article>
      </div>
    </div>
  </section>

  <section class="call" aria-labelledby="call-title">
    <div class="call-media" aria-hidden="true">${photo(18, "", { sizes: "100vw" })}</div>
    <div class="shell">
      <p class="eyebrow">Want on the roster?</p>
      <h2 id="call-title">Start at practice</h2>
      <p class="lede">You do not need armour or a combat background. Meet the team and learn what the sport actually feels like.</p>
      <div class="btn-row"><a class="btn btn-ember" href="training.html#start">${icon("swords")} Try a practice</a></div>
    </div>
  </section>
</main>
${footer()}${dock("team")}${scripts()}`;

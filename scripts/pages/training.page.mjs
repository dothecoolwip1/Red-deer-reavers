import { head, header, footer, dock, scripts, photo, icon } from "./partials.mjs";

export const file = "training.html";
export default () => `${head({
  title: "Training | Red Deer Reavers",
  description: "Start buhurt training with the Red Deer Reavers in Central Alberta. Practices Wednesday and Sunday at Springbrook Archery Centre. No armour or combat experience required.",
  page: "training",
  ogImage: 16
})}${header("training", { cta: ["#start", "Start"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(16, "", { eager: true, pos: "50% 25%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">From first night to first fight</p>
      <h1>Train</h1>
      <p class="lede">You do not need armour. You do not need a combat background. Start with movement, conditioning, safe contact and the team.</p>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="next-title">
    <div class="shell">
      <article class="plate plate-ember rivets muster" data-reveal>
        <div class="war-top" style="display:flex;justify-content:space-between;gap:12px;align-items:center">
          <span class="label"><i class="pulse" aria-hidden="true"></i> Next practice</span>
          <span class="label" style="color:var(--ember-hi)" data-next-practice-date>Weekly</span>
        </div>
        <div>
          <h2 id="next-title" data-next-practice-title style="margin:0 0 6px">Springbrook</h2>
          <p class="lede" style="margin:0" data-next-practice-meta>Wednesday 5:30 PM · Sunday 5:00 PM</p>
        </div>
        <div class="muster-times" data-practice-times>
          <div class="muster-time"><span>WED</span><strong>5:30 PM</strong><small>to 8:00 PM</small></div>
          <div class="muster-time"><span>SUN</span><strong>5:00 PM</strong><small>to 8:00 PM</small></div>
        </div>
        <div class="facts">
          <span class="fact">${icon("pin")}<b data-practice-venue>Springbrook Archery Centre</b></span>
          <span class="fact">${icon("coin")}<b data-practice-fee>$10</b> venue fee</span>
          <span class="fact">${icon("helm")}<b>18+</b> fighter program</span>
          <span class="fact">${icon("shield")}<b>Loaner gear</b> is limited</span>
          <span class="fact">${icon("scroll")}<b>HACSA $100</b> once committed</span>
        </div>
        <div class="btn-row">
          <a class="btn btn-ember" href="#start">${icon("swords")} Try a practice</a>
          <a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=Springbrook+Archery+Centre+Alberta" target="_blank" rel="noopener">${icon("pin")} Directions</a>
        </div>
      </article>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="bring-title">
    <div class="shell lore-grid">
      <div data-reveal>
        <p class="eyebrow">Your first practice</p>
        <h2 id="bring-title">What to bring</h2>
        <p class="illuminated">Nothing specialized. Come ready to move, learn and meet the team. We will show you around, run you through the basics and answer every question you have about armour, safety and where the sport can take you.</p>
      </div>
      <div class="pillars">
        <article class="pillar" data-reveal data-delay="1"><span class="sigil">${icon("flame")}</span><div><h3>Athletic clothes</h3><p>Comfortable gear you can move and sweat in.</p></div></article>
        <article class="pillar" data-reveal data-delay="1"><span class="sigil">${icon("check")}</span><div><h3>Indoor shoes</h3><p>Clean runners with decent grip.</p></div></article>
        <article class="pillar" data-reveal data-delay="2"><span class="sigil">${icon("coin")}</span><div><h3>Water &amp; the venue fee</h3><p>Bring enough water for an active practice.</p></div></article>
        <article class="pillar" data-reveal data-delay="3"><span class="sigil">${icon("shield")}</span><div><h3>Protective cup</h3><p>Optional at first, useful once contact work begins.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="path-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">How training works</p>
        <h2 id="path-title">Your path into armour</h2>
        <p class="lede">No rush and no expectation to compete. You move forward when you are ready.</p>
      </div>
      <div class="path">
        <article class="path-step" data-reveal><span class="numeral"><span>I</span></span><div><h3>Fundamentals</h3><p>Movement, balance, falling safely, conditioning and basic weapon handling.</p></div></article>
        <article class="path-step" data-reveal data-delay="1"><span class="numeral"><span>II</span></span><div><h3>Contact</h3><p>Learn clinch work, grappling, pressure and safe striking mechanics.</p></div></article>
        <article class="path-step" data-reveal data-delay="2"><span class="numeral"><span>III</span></span><div><h3>Soft kit</h3><p>Add timing, tactics, teamwork and more realistic weapon work.</p></div></article>
        <article class="path-step" data-reveal data-delay="3"><span class="numeral"><span>IV</span></span><div><h3>Steel</h3><p>Start armoured training once your skills, conditioning and equipment line up.</p></div></article>
        <article class="path-step" data-reveal data-delay="3"><span class="numeral"><span>V</span></span><div><h3>Your choice</h3><p>Compete, join demos, focus on melee or duels, or simply keep training with the team.</p></div></article>
      </div>
    </div>
  </section>

  <section class="call" id="start" style="text-align:left" aria-labelledby="start-title">
    <div class="call-media" aria-hidden="true">${photo(6, "", { sizes: "100vw" })}</div>
    <div class="shell book-grid">
      <div>
        <p class="eyebrow">Start here</p>
        <h2 id="start-title">Come try it</h2>
        <p class="lede" style="margin:0 0 18px">Send a quick note. We will confirm the session, answer your questions, and make sure somebody knows you are coming.</p>
        <p class="muted">Already training with us? <a href="team.html#add-profile">Add your fighter profile</a> so you appear on the team page.</p>
      </div>
      <form class="plate form" data-join-form>
        <label>Name<input type="text" name="name" autocomplete="name" required></label>
        <label>Best contact<input name="contact" autocomplete="email" placeholder="Email or phone" required></label>
        <label>What sounds right?
          <select name="interest"><option>Trying a practice</option><option>Watching first</option><option>Learning about gear</option><option>Competing eventually</option><option>Volunteering or supporting</option></select>
        </label>
        <label>Message<textarea name="message" rows="4" placeholder="Questions, experience, availability, anything useful."></textarea></label>
        <button class="btn btn-ember btn-block" type="submit">${icon("quill")} Write my message</button>
        <p class="form-note">Opens your email app with the message filled in. The site does not store your information.</p>
      </form>
    </div>
  </section>
</main>
${footer()}${dock("training")}${scripts()}`;

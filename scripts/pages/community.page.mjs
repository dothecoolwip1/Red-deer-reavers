import { head, header, footer, dock, scripts, photo, icon } from "./partials.mjs";

export const file = "community.html";
export default () => `${head({
  title: "Community | Red Deer Reavers",
  description: "Book the Red Deer Reavers for armoured combat demonstrations, schools, homeschool groups, festivals, birthdays, markets and community events in Central Alberta.",
  page: "community",
  ogImage: 18
})}${header("community", { cta: ["#book", "Book us"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(18, "", { eager: true, pos: "50% 35%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Reavers in the community</p>
      <h1>Bring the Steel</h1>
      <p class="lede">Schools, homeschool groups, festivals, markets, birthdays, community organizations and event hosts can bring the Reavers beyond the training hall.</p>
      <div class="btn-row" style="margin-top:22px">
        <a class="btn btn-ember" href="#book">${icon("horn")} Start an inquiry</a>
        <a class="btn" href="#options">See options</a>
      </div>
    </div>
  </section>

  <section class="section" id="options" aria-labelledby="options-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">What we can do</p><h2 id="options-title">More than a fight in armour</h2></div>
        <p class="lede">Armoured combat gets attention, and a good Reavers appearance gives people context too: demonstrations, equipment, sport education, questions, photos and audience interaction, shaped to fit your group and space.</p>
      </div>
      <div class="option-grid">
        <article class="plate option featured rivets" data-reveal><span class="numeral">I</span><div><p class="label">Live demonstration</p><h3>Armoured combat</h3><p>Controlled live combat with an explanation of the rules, equipment, safety, tactics and what the audience is watching.</p></div></article>
        <article class="plate option" data-reveal data-delay="1"><span class="numeral">II</span><div><p class="label">Learn</p><h3>Armour &amp; sport education</h3><p>See modern buhurt equipment up close, learn how it is used, and hear how the sport connects historical inspiration with modern competition.</p></div></article>
        <article class="plate option" data-reveal data-delay="2"><span class="numeral">III</span><div><p class="label">Meet the team</p><h3>Questions &amp; photos</h3><p>A relaxed option for groups who want to meet fighters, ask questions, see armour and take photos without a full combat demonstration.</p></div></article>
        <article class="plate option" data-reveal data-delay="3"><span class="numeral">IV</span><div><p class="label">Build your format</p><h3>Mix what fits</h3><p>Most appearances combine pieces of the options above. We confirm what works once we know the venue, audience, timing and team availability.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="fit-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Good fit for</p>
        <h2 id="fit-title">Community looks different everywhere</h2>
        <p class="lede">You do not need to know exactly what to ask for. Tell us what you are planning and who will be there, and we will work out the right format with you.</p>
      </div>
      <div class="fit-grid">
        <article data-reveal><strong>Schools</strong><span>Class visits, history connections, sport education and activity days.</span></article>
        <article data-reveal data-delay="1"><strong>Homeschool groups</strong><span>Interactive learning sessions, armour, questions and demonstrations.</span></article>
        <article data-reveal data-delay="2"><strong>Festivals &amp; fairs</strong><span>Public demonstrations, scheduled appearances and crowd-friendly explanations.</span></article>
        <article data-reveal><strong>Markets &amp; community days</strong><span>Meet the team, armour displays, recruitment, photos and short demos where suitable.</span></article>
        <article data-reveal data-delay="1"><strong>Birthdays &amp; private groups</strong><span>A memorable introduction to real armoured combat, built around the age group and space.</span></article>
        <article data-reveal data-delay="2"><strong>Local partners</strong><span>Sponsorship, event partnerships, venues, fundraising and community collaboration.</span></article>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-label="Reavers at community events">
    <div class="shell photo-band">
      <figure data-reveal>${photo(7, "Red Deer Reavers team in armour", { sizes: "(max-width: 759px) 66vw, 800px" })}</figure>
      <figure data-reveal data-delay="1">${photo(4, "A Reaver talking with the crowd at the rail", { sizes: "(max-width: 759px) 33vw, 400px" })}</figure>
      <figure data-reveal data-delay="2">${photo(3, "Fighters in the list at an outdoor event", { sizes: "(max-width: 759px) 33vw, 400px" })}</figure>
    </div>
  </section>

  <section class="section" aria-labelledby="process-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">How it works</p>
        <h2 id="process-title">Start simple</h2>
        <p class="lede">An inquiry does not lock either side into a booking. It gives us enough to check the team, venue, safety needs, travel and the format that makes sense.</p>
      </div>
      <div class="steps">
        <article class="step" data-reveal><span class="step-num">I</span><div><h3>Tell us about it</h3><p>Share the date if you have one, the location, the audience and the kind of event or group.</p></div></article>
        <article class="step" data-reveal data-delay="1"><span class="step-num">II</span><div><h3>We shape the idea</h3><p>We look at team availability and what kind of appearance fits the space and audience.</p></div></article>
        <article class="step" data-reveal data-delay="2"><span class="step-num">III</span><div><h3>Confirm the details</h3><p>Timing, setup, safety boundaries, travel, expectations and any costs or donations, agreed before the day.</p></div></article>
      </div>
    </div>
  </section>

  <section class="call" id="book" style="text-align:left" aria-labelledby="book-title">
    <div class="call-media" aria-hidden="true">${photo(10, "", { sizes: "100vw" })}</div>
    <div class="shell book-grid">
      <div>
        <p class="eyebrow">Book · Partner · Ask</p>
        <h2 id="book-title">Tell us what you are thinking</h2>
        <p class="lede" style="margin:0 0 18px">You do not need a finished plan. Send the basics and the Reavers will work out whether we are a fit.</p>
        <div class="chip-row"><span class="chip">Central Alberta</span><span class="chip">Schools &amp; groups</span><span class="chip">Public events</span><span class="chip">Partnerships</span></div>
      </div>
      <form class="plate form" data-community-form>
        <div class="form-row">
          <label>Your name<input type="text" name="name" autocomplete="name" required maxlength="120"></label>
          <label>Organization, optional<input type="text" name="organization" autocomplete="organization" maxlength="180"></label>
        </div>
        <label>Best contact<input name="contact" autocomplete="email" placeholder="Email or phone" required maxlength="240"></label>
        <div class="form-row">
          <label>What are you planning?
            <select name="event_type">
              <option value="school">School</option>
              <option value="homeschool">Homeschool group</option>
              <option value="festival">Festival / fair</option>
              <option value="market">Market / community day</option>
              <option value="birthday">Birthday</option>
              <option value="community_event" selected>Community event</option>
              <option value="private_event">Private group</option>
              <option value="sponsor">Sponsorship / partnership</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label>Date, if known<input type="date" name="event_date"></label>
        </div>
        <div class="form-row">
          <label>Location<input name="location" placeholder="City, venue or area" maxlength="240"></label>
          <label>Estimated group size<input type="number" name="audience_size" min="1" max="100000" inputmode="numeric" placeholder="Approx."></label>
        </div>
        <label>Tell us about it<textarea name="details" rows="5" maxlength="3000" placeholder="What is the event, who is attending, what would you like people to experience, and anything else we should know?"></textarea></label>
        <label class="website-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <button class="btn btn-ember btn-block" type="submit">Send inquiry</button>
        <p class="form-status" data-community-form-status aria-live="polite">Your inquiry goes directly to the Reavers team admin.</p>
      </form>
    </div>
  </section>
</main>
${footer()}${dock("community")}${scripts()}`;

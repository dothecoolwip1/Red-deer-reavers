import { head, header, footer, dock, scripts, photo, icon, SOCIAL } from "./partials.mjs";

export const file = "events.html";
export default () => `${head({
  title: "Events | Red Deer Reavers",
  description: "Red Deer Reavers tournaments, demonstrations, public appearances and results. Add events to your calendar and follow the team's tournament record from BuhurtOS.",
  page: "events",
  ogImage: 22,
  extra: `\n  <script src="vendor/add-to-calendar-button/dist/atcb.min.js" defer></script>`
})}${header("events", { cta: ["community.html#book", "Book us"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(22, "", { eager: true, pos: "60% 45%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Where the team shows up</p>
      <h1>Events</h1>
      <p class="lede">Tournaments, public appearances, team dates, and places to see armoured combat outside a normal practice.</p>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="next-title">
    <div class="shell">
      <article class="plate plate-ember rivets muster" data-reveal>
        <span class="label">${icon("banner")} Up next</span>
        <h2 id="next-title" class="sr-only">Next event</h2>
        <div data-upcoming-event><div class="hub-empty"><strong>Checking the calendar…</strong></div></div>
        <p class="muted" style="margin:0">Confirmed dates only. When a public Reavers date is locked in, it belongs here.</p>
        <div class="btn-row">
          <a class="btn btn-ember" href="${SOCIAL.facebook}" target="_blank" rel="noopener">${icon("facebook")} Facebook</a>
          <a class="btn" href="${SOCIAL.instagram}" target="_blank" rel="noopener">${icon("instagram")} Instagram</a>
        </div>
      </article>
    </div>
  </section>

  <section class="section" aria-labelledby="calendar-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">The calendar</p><h2 id="calendar-title">Upcoming schedule</h2></div>
        <p class="lede">Tournaments, demos, meetings and special team dates, including events the Reavers host or enter on BuhurtOS. Tap a date to add it to your own calendar.</p>
      </div>
      <div class="event-list" data-event-list></div>
    </div>
  </section>

  <section class="section parchment" id="results" aria-labelledby="results-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Results</p>
        <h2 id="results-title">The tournament record</h2>
        <p class="lede">Placings from every tournament run on BuhurtOS, recorded permanently. Test events are never counted.</p>
      </div>
      <div class="plate" style="margin-bottom:16px" data-reveal>
        <span class="label">${icon("medal")} Latest result</span>
        <div data-latest-result style="margin-top:10px"><div class="hub-empty"><strong>Checking the record…</strong></div></div>
      </div>
      <div class="results-list" data-results-list></div>
      <p style="text-align:center;margin:22px 0 0"><a class="text-link" data-bos-link="team" href="https://buhurtos.ca/teams/red-deer-reavers" target="_blank" rel="noopener">The Reavers on BuhurtOS ${icon("external")}</a></p>
    </div>
  </section>

  <section class="call" aria-labelledby="call-title">
    <div class="call-media" aria-hidden="true">${photo(4, "", { sizes: "100vw" })}</div>
    <div class="shell">
      <p class="eyebrow">Looking to book the team?</p>
      <h2 id="call-title">Bring the Reavers</h2>
      <p class="lede">Schools, demos, festivals, birthdays, community events and partnerships all start on the Community page.</p>
      <div class="btn-row"><a class="btn btn-ember" href="community.html">${icon("horn")} Open Community</a></div>
    </div>
  </section>
</main>
${footer()}${dock("events")}${scripts()}`;

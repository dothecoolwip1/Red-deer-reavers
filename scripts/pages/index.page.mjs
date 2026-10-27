import { head, header, footer, dock, scripts, marquee, photo, heroPicture, icon, SITE, SOCIAL } from "./partials.mjs";

export const file = "index.html";
export default () => `${head({
  title: "Red Deer Reavers | Central Alberta Buhurt",
  description: "Red Deer Reavers: full-contact armoured combat (buhurt) in Central Alberta. Meet the fighters, see training times and events, and join a practice. No armour or experience needed.",
  page: "home",
  ogImage: 14,
  // Tells search engines who the team is and which social accounts are theirs.
  extra: `
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: "Red Deer Reavers",
    alternateName: "Red Deer Reavers Guild",
    sport: "Buhurt (full-contact armoured combat)",
    url: `${SITE}/`,
    logo: `${SITE}/assets/icon-512.png`,
    email: "reddeerreavers@gmail.com",
    location: { "@type": "Place", name: "Red Deer, Alberta", address: { "@type": "PostalAddress", addressLocality: "Red Deer", addressRegion: "AB", addressCountry: "CA" } },
    sameAs: [SOCIAL.instagram, SOCIAL.facebook]
  })}</script>`
})}${header("home")}
<main id="content">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-media" aria-hidden="true">${heroPicture(6, 14, { posPortrait: "50% 20%", posLandscape: "42% 30%" })}</div>
    <canvas class="embers" data-embers aria-hidden="true"></canvas>
    <div class="shell hero-content">
      <div>
        <p class="hero-season"><span class="pulse" aria-hidden="true"></span><span><b data-season>2026</b> Season · Recruiting now</span></p>
        <h1 class="hero-title" id="hero-title"><span class="small">Red Deer</span><span class="big">Reavers</span></h1>
        <p class="hero-tagline">Train together. <em>Fight together.</em></p>
        <div class="btn-row">
          <a class="btn btn-ember" href="training.html#start">${icon("swords")} Join a practice</a>
          <a class="btn" href="team.html">${icon("shield")} Meet the fighters</a>
        </div>
      </div>
      <img class="hero-crest" src="assets/crest-640.webp" alt="Red Deer Reavers crest" width="330" height="330" decoding="async">
    </div>
    <a class="scroll-cue" href="#war-table" aria-label="Scroll to what is happening now">${icon("chevron")}</a>
  </section>

  ${marquee(["Sword &amp; Shield", "Polearm", "Longsword", "5v5 Melee", "3v3 Melee", "Sword &amp; Buckler", "Profight", "Central Alberta"])}

  <section class="section-tight" id="war-table" aria-labelledby="war-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">The war table</p><h2 id="war-title">What’s happening now</h2></div>
        <a class="text-link head-link" href="events.html">Full schedule ${icon("arrow")}</a>
      </div>
      <div class="war-grid">
        <article class="plate plate-ember rivets war-card" data-reveal>
          <div class="war-top"><span class="label"><i class="pulse" aria-hidden="true"></i> Next practice</span><span class="war-date" data-next-practice-date>Weekly</span></div>
          <h3 data-next-practice-title>Sunday practice</h3>
          <p data-next-practice-meta>5:00 PM to 8:00 PM · Springbrook Archery Centre</p>
          <div class="war-actions">
            <a class="text-link" href="training.html#start">Try a practice ${icon("arrow")}</a>
            <a class="text-link" href="https://www.google.com/maps/search/?api=1&amp;query=Springbrook+Archery+Centre+Alberta" target="_blank" rel="noopener">${icon("pin")} Map</a>
          </div>
        </article>
        <article class="plate war-card" data-reveal data-delay="1">
          <span class="label">${icon("banner")} Upcoming event</span>
          <div data-upcoming-event><div class="hub-empty"><strong>Checking the calendar…</strong></div></div>
          <div class="war-actions"><a class="text-link" href="events.html">Events ${icon("arrow")}</a></div>
        </article>
        <article class="plate war-card" data-reveal data-delay="2">
          <span class="label">${icon("medal")} Latest result</span>
          <div data-latest-result><div class="hub-empty"><strong>Checking the record…</strong></div></div>
          <div class="war-actions"><a class="text-link" href="events.html#results">Results ${icon("arrow")}</a></div>
        </article>
        <article class="plate war-card" data-reveal data-delay="3">
          <span class="label">${icon("shield")} The company</span>
          <div class="war-value" data-roster-count>—</div>
          <p>Fighters, squires, crew and leadership.</p>
          <div class="war-actions"><a class="text-link" href="team.html">Roster ${icon("arrow")}</a></div>
        </article>
      </div>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="lore-title">
    <div class="shell lore-grid">
      <div class="lore-copy" data-reveal>
        <p class="eyebrow">What is buhurt?</p>
        <h2 id="lore-title">Medieval combat. Modern sport.</h2>
        <p class="illuminated">Buhurt is full-contact armoured combat fought as a real sport. Fighters wear historically based steel armour and fight with blunted steel weapons, in team melees and one-on-one duels, under international rules with marshals in the list.</p>
        <p>The Reavers train in Red Deer and compete across Alberta and beyond. Most of us started with no armour and no combat background. Everyone begins with the basics.</p>
        <a class="text-link" href="training.html">How training works ${icon("arrow")}</a>
      </div>
      <div class="pillars">
        <article class="pillar" data-reveal data-delay="1"><span class="sigil">${icon("helm")}</span><div><h3>Real steel</h3><p>Historically based armour and blunted steel weapons, checked before anyone steps into the list.</p></div></article>
        <article class="pillar" data-reveal data-delay="2"><span class="sigil">${icon("swords")}</span><div><h3>Real contact</h3><p>Strikes, shoves, clinches and takedowns, fought hard and judged under clear rules.</p></div></article>
        <article class="pillar" data-reveal data-delay="3"><span class="sigil">${icon("shield")}</span><div><h3>Real team</h3><p>Melee is won together. Fighters, squires and crew all carry the result.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="fighters-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">The fighters</p><h2 id="fighters-title">Sworn to the banner</h2></div>
        <p class="lede">Every profile is pulled live from BuhurtOS. Records, disciplines and photos stay current as the fighters update them.</p>
      </div>
      <div class="fighter-rail" data-fighter-rail></div>
      <div class="btn-row" style="margin-top:26px">
        <a class="btn btn-royal" href="team.html">${icon("shield")} Meet the company</a>
        <a class="btn" href="team.html#add-profile">${icon("quill")} Add your fighter profile</a>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0" aria-labelledby="path-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">From first night to first fight</p>
        <h2 id="path-title">Your path into armour</h2>
        <p class="lede">No rush and no expectation to compete. You move forward when you are ready.</p>
      </div>
      <div class="path">
        <article class="path-step" data-reveal><span class="numeral"><span>I</span></span><div><h3>Fundamentals</h3><p>Movement, balance, falling safely, conditioning and basic weapon handling.</p></div></article>
        <article class="path-step" data-reveal data-delay="1"><span class="numeral"><span>II</span></span><div><h3>Contact</h3><p>Clinch work, grappling, pressure and safe striking mechanics.</p></div></article>
        <article class="path-step" data-reveal data-delay="2"><span class="numeral"><span>III</span></span><div><h3>Soft kit</h3><p>Timing, tactics, teamwork and more realistic weapon work.</p></div></article>
        <article class="path-step" data-reveal data-delay="3"><span class="numeral"><span>IV</span></span><div><h3>Steel</h3><p>Armoured training once your skills, conditioning and kit line up.</p></div></article>
        <article class="path-step" data-reveal data-delay="3"><span class="numeral"><span>V</span></span><div><h3>Your choice</h3><p>Compete, join demos, focus on melee or duels, or simply keep training.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="muster-title">
    <div class="shell">
      <div class="plate plate-royal rivets muster" data-reveal>
        <div class="section-head split" style="margin:0">
          <div><p class="eyebrow">Weekly muster</p><h2 id="muster-title">Springbrook Archery Centre</h2></div>
          <p class="lede" style="margin:0">Two team practices every week. Come watch, or come try it.</p>
        </div>
        <div class="muster-times" data-practice-times>
          <div class="muster-time"><span>WED</span><strong>5:30 PM</strong><small>to 8:00 PM</small></div>
          <div class="muster-time"><span>SUN</span><strong>5:00 PM</strong><small>to 8:00 PM</small></div>
        </div>
        <div class="facts">
          <span class="fact">${icon("coin")}<b data-practice-fee>$10</b> venue fee</span>
          <span class="fact">${icon("helm")}<b>18+</b> fighter program</span>
          <span class="fact">${icon("flame")}<b>Beginner</b> friendly</span>
        </div>
        <div class="btn-row">
          <a class="btn btn-ember" href="training.html">Training details ${icon("arrow")}</a>
          <a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=Springbrook+Archery+Centre+Alberta" target="_blank" rel="noopener">${icon("pin")} Directions</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="gallery-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">From the rail</p><h2 id="gallery-title">Steel in motion</h2></div>
        <a class="text-link head-link" href="media.html">Open the gallery ${icon("arrow")}</a>
      </div>
      <div class="mosaic">
        <a class="tall" href="media.html" data-reveal>${photo(21, "Reavers fighter in a great helm at the list", { sizes: "(max-width: 759px) 50vw, 33vw", pos: "55% 30%" })}</a>
        <a href="media.html" data-reveal data-delay="1">${photo(8, "Two fighters in steel helms locked together", { sizes: "(max-width: 759px) 50vw, 17vw" })}</a>
        <a href="media.html" data-reveal data-delay="2">${photo(6, "Close up of a perforated steel helm", { sizes: "(max-width: 759px) 50vw, 17vw" })}</a>
        <a class="wide" href="media.html" data-reveal data-delay="1">${photo(22, "Armoured fighters clashing in the list", { sizes: "(max-width: 759px) 100vw, 33vw" })}</a>
        <a href="media.html" data-reveal data-delay="2">${photo(13, "Fighters with polearms waiting at the rail", { sizes: "(max-width: 759px) 50vw, 17vw" })}</a>
        <a href="media.html" data-reveal data-delay="3">${photo(19, "A Reaver between fights", { sizes: "(max-width: 759px) 50vw, 17vw" })}</a>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0" data-social-strip-section hidden aria-labelledby="fresh-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">Fresh from our socials</p><h2 id="fresh-title">Latest posts</h2></div>
        <a class="text-link head-link" href="social.html">All our channels ${icon("arrow")}</a>
      </div>
      <div class="feed-strip" data-social-strip></div>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="news-title">
    <div class="shell">
      <div class="section-head center">
        <p class="eyebrow">Proclamations</p>
        <h2 id="news-title">From the team board</h2>
      </div>
      <div class="news-grid" data-team-updates></div>
    </div>
  </section>

  <section class="call" aria-labelledby="call-title">
    <div class="call-media" aria-hidden="true">${photo(7, "", { sizes: "100vw" })}</div>
    <div class="shell">
      <p class="eyebrow">Schools · Festivals · Markets · Birthdays</p>
      <h2 id="call-title">Bring the steel<br>to your people</h2>
      <p class="lede">Live armoured combat demonstrations, armour up close, and fighters to meet. We shape the visit around your audience and space.</p>
      <div class="btn-row">
        <a class="btn btn-ember" href="community.html#book">${icon("horn")} Book the Reavers</a>
        <a class="btn" href="community.html">What we offer</a>
      </div>
    </div>
  </section>
</main>
${footer()}${dock("home")}${scripts()}`;

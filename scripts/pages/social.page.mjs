import { head, header, footer, dock, scripts, photo, icon, SOCIAL, BOS_SITE } from "./partials.mjs";

export const file = "social.html";
export default () => `${head({
  title: "Social | Red Deer Reavers",
  description: "Every Red Deer Reavers channel in one place: Instagram, Facebook, fighter records on BuhurtOS and email, with the latest photos from our posts.",
  page: "social",
  ogImage: 19
})}${header("social", { cta: [SOCIAL.instagram, "Follow"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(19, "", { eager: true, pos: "40% 35%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Every channel, one place</p>
      <h1>Social</h1>
      <p class="lede">Follow the Reavers wherever you are. Photos from our latest posts land on this page automatically.</p>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="channels-title">
    <div class="shell">
      <h2 id="channels-title" class="sr-only">Our channels</h2>
      <div class="channel-grid">
        <a class="plate channel-card ig rivets" href="${SOCIAL.instagram}" target="_blank" rel="noopener" data-reveal>
          <span class="channel-icon">${icon("instagram")}</span>
          <span class="label">Instagram</span>
          <strong>@red_deer_reavers</strong>
          <p>Fight photos, practice clips and tournament-day stories.</p>
          <span class="text-link">Follow ${icon("external")}</span>
        </a>
        <a class="plate channel-card fb rivets" href="${SOCIAL.facebook}" target="_blank" rel="noopener" data-reveal data-delay="1">
          <span class="channel-icon">${icon("facebook")}</span>
          <span class="label">Facebook</span>
          <strong>Red Deer Reavers</strong>
          <p>Event announcements, photo albums and community news.</p>
          <span class="text-link">Follow ${icon("external")}</span>
        </a>
        <a class="plate channel-card bos" href="${BOS_SITE}/teams/red-deer-reavers" target="_blank" rel="noopener" data-reveal data-delay="2">
          <span class="channel-icon">${icon("shield")}</span>
          <span class="label">BuhurtOS</span>
          <strong>Fighter records</strong>
          <p>Our fighters, results and tournament history, kept permanently.</p>
          <span class="text-link">View the team ${icon("external")}</span>
        </a>
        <a class="plate channel-card mail" href="mailto:reddeerreavers@gmail.com" data-reveal data-delay="3">
          <span class="channel-icon">${icon("quill")}</span>
          <span class="label">Email</span>
          <strong>Write to us</strong>
          <p><span class="mail-address">reddeerreavers@gmail.com</span>Questions, bookings, sponsorships and anything else.</p>
          <span class="text-link">Send an email ${icon("arrow")}</span>
        </a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="feed-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">From our posts</p><h2 id="feed-title">Fresh from the feed</h2></div>
        <p class="lede">The newest photos from Instagram and Facebook, gathered here automatically. Tap one to open the original post.</p>
      </div>
      <div class="feed-filters" role="group" aria-label="Show posts from" data-feed-filters hidden>
        <button type="button" class="chip-btn" data-feed-filter="all" aria-pressed="true">All</button>
        <button type="button" class="chip-btn" data-feed-filter="instagram" aria-pressed="false">${icon("instagram")} Instagram</button>
        <button type="button" class="chip-btn" data-feed-filter="facebook" aria-pressed="false">${icon("facebook")} Facebook</button>
      </div>
      <div class="feed-grid" data-social-feed aria-live="polite"></div>
      <div class="btn-row" style="justify-content:center;margin-top:24px" data-feed-more-row hidden><button type="button" class="btn" data-feed-more>Show more</button></div>
    </div>
  </section>

  <section class="section parchment" aria-labelledby="tag-title">
    <div class="shell lore-grid">
      <div data-reveal>
        <p class="eyebrow">Caught us on camera?</p>
        <h2 id="tag-title">Tag the Reavers</h2>
        <p class="illuminated">Took photos at a tournament, demo or market? Tag @red_deer_reavers on Instagram or the Red Deer Reavers page on Facebook. When we share it, it can end up right here on the site.</p>
      </div>
      <div class="pillars">
        <article class="pillar" data-reveal data-delay="1"><span class="sigil">${icon("instagram")}</span><div><h3>Instagram</h3><p>Tag @red_deer_reavers in your post or story.</p></div></article>
        <article class="pillar" data-reveal data-delay="2"><span class="sigil">${icon("facebook")}</span><div><h3>Facebook</h3><p>Tag the Red Deer Reavers page or post in the comments of our event.</p></div></article>
        <article class="pillar" data-reveal data-delay="3"><span class="sigil">${icon("frame")}</span><div><h3>The gallery</h3><p>Synced photos also join the <a href="media.html">Media gallery</a>.</p></div></article>
      </div>
    </div>
  </section>

  <section class="call" aria-labelledby="call-title">
    <div class="call-media" aria-hidden="true">${photo(10, "", { sizes: "100vw" })}</div>
    <div class="shell">
      <p class="eyebrow">See it in person</p>
      <h2 id="call-title">Come to a practice</h2>
      <p class="lede">The feed is good. The real thing is louder. Watch a practice or try it yourself.</p>
      <div class="btn-row"><a class="btn btn-ember" href="training.html#start">${icon("swords")} Join a practice</a><a class="btn" href="events.html">${icon("banner")} Upcoming events</a></div>
    </div>
  </section>
</main>
${footer()}${dock("social")}${scripts()}`;

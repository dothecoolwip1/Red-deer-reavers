import { head, header, footer, dock, scripts, photo, icon, V } from "./partials.mjs";

export const file = "media.html";
export default () => `${head({
  title: "Media | Red Deer Reavers",
  description: "Photos from Red Deer Reavers training, demos, armour days and armoured combat tournaments.",
  page: "media",
  ogImage: 21,
  extra: `\n  <link rel="stylesheet" href="vendor/photoswipe/photoswipe.css?v=${V}">`
})}${header("media", { cta: ["https://www.instagram.com/red_deer_reavers/", "Follow"] })}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(21, "", { eager: true, pos: "55% 30%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">From the rail</p>
      <h1>Media</h1>
      <p class="lede">Real Reavers, real practices, real armour. Tap any photo to open the gallery.</p>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="gallery-title">
    <div class="shell">
      <div class="section-head split">
        <div><p class="eyebrow">Gallery</p><h2 id="gallery-title">The team in motion</h2></div>
        <p class="lede">Training, armour days, demos, and the moments around the fighting that make the team what it is.</p>
      </div>
      <div class="gallery-page" data-gallery-grid></div>
    </div>
  </section>

  <section class="call" aria-labelledby="call-title">
    <div class="call-media" aria-hidden="true">${photo(9, "", { sizes: "100vw" })}</div>
    <div class="shell">
      <p class="eyebrow">Follow the team</p>
      <h2 id="call-title">See more as it happens</h2>
      <p class="lede">Instagram and Facebook get the quickest practice, event and tournament updates.</p>
      <div class="btn-row">
        <a class="btn btn-ember" href="https://www.instagram.com/red_deer_reavers/" target="_blank" rel="noopener">${icon("instagram")} Instagram</a>
        <a class="btn btn-royal" href="https://www.facebook.com/profile.php?id=61566406838469" target="_blank" rel="noopener">${icon("facebook")} Facebook</a>
      </div>
    </div>
  </section>
</main>
${footer()}${dock("media")}${scripts(`<script type="module" src="gallery.js?v=${V}"></script>`)}`;

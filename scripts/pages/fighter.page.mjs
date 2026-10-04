import { head, header, footer, dock, scripts, V } from "./partials.mjs";

export const file = "fighter.html";
export default () => `${head({
  title: "Fighter profile | Red Deer Reavers",
  description: "Red Deer Reavers fighter profile: disciplines, record and tournament history from BuhurtOS.",
  page: "fighter",
  ogImage: 16
})}${header("team", { solid: true })}
<main id="content">
  <div data-fighter-profile aria-live="polite">
    <section class="fighter-hero">
      <div class="shell">
        <div class="shield lg skeleton" style="margin:0 auto 18px" aria-hidden="true"><div class="shield-inner"></div></div>
        <p class="eyebrow">Fighter profile</p>
        <h1>Summoning…</h1>
        <p class="lede" style="margin:0 auto">Loading this fighter’s record from BuhurtOS.</p>
      </div>
    </section>
  </div>
  <noscript><section class="section-tight"><div class="shell"><p class="lede">Fighter profiles load from BuhurtOS and need JavaScript. You can browse every profile at <a href="https://buhurtos.ca/teams/red-deer-reavers">buhurtos.ca</a>.</p></div></section></noscript>
</main>
${footer()}${dock("team")}${scripts(`<script src="fighter.js?v=${V}" defer></script>`)}`;

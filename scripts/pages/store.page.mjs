import { head, header, footer, dock, scripts, photo, icon, V } from "./partials.mjs";

// The merch store. Items, prices and photos come live from the Reavers app (Pay the club → Website → Merch store), and
// checkout goes through the club's Square account (assets/js/store.js), so sales land in the app's Square sales page.
export const file = "store.html";
export default () => `${head({
  title: "Merch store | Red Deer Reavers",
  description: "Red Deer Reavers stickers and fighter trading cards. Pay online with card, Apple Pay or Google Pay through Square and pick up at a practice or event.",
  page: "store",
  ogImage: 7,
  extra: `\n  <link rel="stylesheet" href="assets/store.css?v=${V}">`
})}${header("store")}
<main id="content">
  <section class="page-hero">
    <div class="hero-media" aria-hidden="true">${photo(7, "", { eager: true, pos: "50% 35%" })}</div>
    <div class="shell hero-content">
      <p class="eyebrow">Support the company</p>
      <h1>Merch store</h1>
      <p class="lede">Crest stickers and fighter trading cards. Every sale helps pay for armour, mats and tournament travel.</p>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="store-title">
    <div class="shell">
      <h2 id="store-title" class="sr-only">For sale</h2>
      <p class="plate store-banner good" data-store-paid hidden role="status">${icon("shield")}<span><strong>Thank you!</strong> Your payment went through and Square has emailed your receipt. Show it at any practice or Reavers event to pick up your order.</span></p>
      <div class="store-grid" data-store-items aria-busy="true">
        <p class="store-loading">Loading what's for sale…</p>
      </div>
      <p class="store-empty plate" data-store-empty hidden>Online orders aren't open right now. Stickers and trading cards are always on the merch table at practices and events, by card or cash.</p>
    </div>
  </section>

  <section class="section-tight store-how" aria-labelledby="how-title">
    <div class="shell">
      <div class="section-head"><p class="eyebrow">How it works</p><h2 id="how-title">Order, pay, pick up</h2></div>
      <ol class="store-steps">
        <li class="plate"><strong>Pick what you want</strong><span>Choose how many and enter your name and email.</span></li>
        <li class="plate"><strong>Pay on Square</strong><span>Card, Apple Pay or Google Pay on Square's secure page. Your receipt comes by email.</span></li>
        <li class="plate"><strong>Pick it up</strong><span>Show your receipt at any <a href="training.html">practice</a> or <a href="events.html">Reavers event</a> and we'll hand it over.</span></li>
      </ol>
      <p class="form-note">Questions about an order? Email <a href="mailto:reddeerreavers@gmail.com">reddeerreavers@gmail.com</a>.</p>
    </div>
  </section>
</main>
${footer()}${dock("store")}${scripts(`<script src="assets/js/store.js?v=${V}" defer></script>`)}`;

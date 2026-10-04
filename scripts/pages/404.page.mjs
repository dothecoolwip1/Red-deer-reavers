import { V } from "./partials.mjs";

export const file = "404.html";
export default () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#09070a">
  <meta name="robots" content="noindex">
  <title>Out of bounds | Red Deer Reavers</title>
  <link rel="icon" href="assets/crest-96.webp" type="image/webp">
  <link rel="stylesheet" href="styles.css?v=${V}">
  <style>@font-face{font-family:"Grenze Gotisch";src:url("vendor/fonts/grenze-gotisch-latin-wght-normal.woff2") format("woff2");font-weight:100 900;font-display:swap}@font-face{font-family:"Cinzel";src:url("vendor/fonts/cinzel-latin-wght-normal.woff2") format("woff2");font-weight:400 900;font-display:swap}body{padding-bottom:0}</style>
</head>
<body>
<main class="lost">
  <div class="shell">
    <img src="assets/crest-256.webp" alt="Red Deer Reavers crest" width="140" height="140">
    <p class="eyebrow">404</p>
    <h1>Out of bounds</h1>
    <p class="lede" style="margin:0 auto 26px">That page lies beyond the edge of the list.</p>
    <a class="btn btn-ember" href="index.html">Back to the Reavers</a>
  </div>
</main>
</body>
</html>
`;

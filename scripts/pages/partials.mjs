// Shared page chrome for the Reavers site. `npm run pages` writes the root HTML files from scripts/pages/*.page.mjs.
export const V = "25";

/** BuhurtOS is served from GitHub Pages. (buhurtos.ca is NOT a working address.) */
export const BOS_SITE = "https://dothecoolwip1.github.io/BuhurtOS";

export const SOCIAL = {
  instagram: "https://www.instagram.com/red_deer_reavers/",
  facebook: "https://www.facebook.com/share/1BZE4wGtyz/"
};

export const icon = (id, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="assets/icons.svg#${id}"></use></svg>`;

const widths = [360, 720, 1200, 1600];
/** Responsive gallery image from the generated WebP set (built by scripts/build-site.mjs). */
export const photo = (n, alt, { sizes = "100vw", eager = false, cls = "", pos = "" } = {}) => {
  const id = String(n).padStart(2, "0");
  const srcset = widths.map(w => `assets/generated/gallery/image-${id}-${w}.webp ${w}w`).join(", ");
  return `<img${cls ? ` class="${cls}"` : ""} src="assets/generated/gallery/image-${id}-1200.webp" srcset="${srcset}" sizes="${sizes}" alt="${alt}"${eager ? ` fetchpriority="high"` : ` loading="lazy"`} decoding="async"${pos ? ` style="object-position:${pos}"` : ""}>`;
};

/** Art-directed hero: a portrait photo on upright screens, a landscape photo on wide ones. */
export const heroPicture = (portrait, landscape, { posPortrait = "50% 30%", posLandscape = "50% 35%" } = {}) => {
  const set = n => widths.map(w => `assets/generated/gallery/image-${String(n).padStart(2, "0")}-${w}.webp ${w}w`).join(", ");
  return `<picture><source media="(orientation: portrait)" srcset="${set(portrait)}" sizes="100vw"><img src="assets/generated/gallery/image-${String(landscape).padStart(2, "0")}-1600.webp" srcset="${set(landscape)}" sizes="100vw" alt="" fetchpriority="high" decoding="async" style="--pos-portrait:${posPortrait};--pos-landscape:${posLandscape}"></picture>`;
};

export const head = ({ title, description, page, ogImage = 14, extra = "" }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#09070a">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="assets/generated/gallery/image-${String(ogImage).padStart(2, "0")}-1200.webp">
  <meta name="twitter:card" content="summary_large_image">
  <title>${title}</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="assets/crest-96.webp" type="image/webp">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
  <link rel="preload" href="vendor/fonts/grenze-gotisch-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="vendor/fonts/cinzel-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="styles.css?v=${V}">${extra}
</head>
<body data-page="${page}">
<a class="skip-link" href="#content">Skip to content</a>
`;

const NAV = [
  ["team", "team.html", "Team"],
  ["training", "training.html", "Training"],
  ["events", "events.html", "Events"],
  ["community", "community.html", "Community"],
  ["media", "media.html", "Media", "nav-wide"],
  ["social", "social.html", "Social"],
  ["members", "members.html", "Members"]
];

export const header = (active, { solid = false, cta = ["training.html#start", "Join"] } = {}) => `
<header class="site-header${solid ? " always-solid" : ""}" data-header>
  <div class="shell header-inner">
    <a class="brand" href="index.html">
      <img src="assets/crest-96.webp" alt="" width="52" height="52">
      <span class="brand-word"><strong>Reavers</strong><small>Red Deer · Alberta</small></span>
    </a>
    <nav class="main-nav" aria-label="Primary">${NAV.map(([key, href, label, cls]) => `<a href="${href}"${cls ? ` class="${cls}"` : ""}${key === active ? ` aria-current="page"` : ""}>${label}</a>`).join("")}</nav>
    <a class="btn btn-ember btn-sm header-cta" href="${cta[0]}">${cta[1]}</a>
  </div>
</header>
`;

const DOCK = [
  ["home", "index.html", "Home", "keep"],
  ["team", "team.html", "Team", "shield"],
  ["join", "training.html#start", "Join", "swords"],
  ["events", "events.html", "Events", "banner"],
  ["community", "community.html", "Book", "horn"]
];

export const dock = active => `
<nav class="dock" aria-label="Mobile navigation">
${DOCK.map(([key, href, label, glyph]) => key === "join"
    ? `  <a class="dock-join" href="${href}"${active === "training" ? ` aria-current="page"` : ""}><span class="crest">${icon(glyph)}</span><span class="word">${label}</span></a>`
    : `  <a href="${href}"${key === active ? ` aria-current="page"` : ""}>${icon(glyph)}<span>${label}</span></a>`).join("\n")}
</nav>
`;

export const footer = () => `
<footer class="site-footer">
  <div class="per-pale" aria-hidden="true"></div>
  <div class="shell">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <img src="assets/crest-256.webp" alt="Red Deer Reavers crest" width="84" height="84" loading="lazy">
          <div><strong>Red Deer Reavers</strong><span>Central Alberta Buhurt</span></div>
        </div>
        <p class="footer-motto">Train together · Fight together</p>
      </div>
      <div class="footer-cols">
        <div>
          <h2 class="footer-h">The Company</h2>
          <a href="team.html">Fighters &amp; crew</a>
          <a href="team.html#add-profile">Add your profile</a>
          <a href="training.html">Training</a>
          <a href="training.html#start">Join a practice</a>
          <a href="about.html">About the guild</a>
        </div>
        <div>
          <h2 class="footer-h">The Field</h2>
          <a href="events.html">Events</a>
          <a href="events.html#results">Results</a>
          <a href="community.html">Book the Reavers</a>
          <a href="media.html">Media</a>
          <a href="members.html">Members area</a>
          <a href="agm.html">AGM</a>
        </div>
        <div>
          <h2 class="footer-h">Follow</h2>
          <a href="social.html">${icon("horn")}All our channels</a>
          <a href="${SOCIAL.instagram}" target="_blank" rel="noopener">${icon("instagram")}Instagram</a>
          <a href="${SOCIAL.facebook}" target="_blank" rel="noopener">${icon("facebook")}Facebook</a>
          <a href="mailto:reddeerreavers@gmail.com">${icon("quill")}Email</a>
        </div>
      </div>
    </div>
    <div class="footer-base">
      <span>© <span data-year>2026</span> Red Deer Reavers Guild</span>
      <span class="powered">Fighter records kept on <a href="${BOS_SITE}/" target="_blank" rel="noopener">BuhurtOS</a></span>
    </div>
  </div>
</footer>
`;

export const scripts = (...extra) => `
<script src="team-data.js?v=${V}"></script>
<script src="buhurtos.js?v=${V}"></script>
<script src="app.js?v=${V}" defer></script>${extra.map(s => `\n${s}`).join("")}
</body>
</html>
`;

export const marquee = words => `
<div class="marquee">
  <div class="marquee-track" data-marquee aria-hidden="true">
    <div class="marquee-group">${words.map(w => `<span>${w}</span><i></i>`).join("")}</div>
  </div>
  <button class="motion-toggle" type="button" data-motion-toggle aria-pressed="false"><span class="sr-only">Pause animations</span><span aria-hidden="true" class="bars"></span></button>
</div>
`;

export const rule = `<div class="rule" aria-hidden="true"><i></i></div>`;

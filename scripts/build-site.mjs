import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";

const root = process.cwd();
const out = path.join(root, "_site");
const publicFiles = [
  "404.html","admin.css","admin.html","admin.js","app.js","buhurtos.js","community.html",
  "events.html","fighter.html","fighter.js","gallery.js","index.html","manifest.webmanifest",
  "media.html","social.html","styles.css","sw.js","team-data.js","team.html","training.html"
];

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

for (const file of publicFiles) {
  await fs.copyFile(path.join(root, file), path.join(out, file));
}
await fs.cp(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });

const generatedGallery = path.join(out, "assets", "generated", "gallery");
const generatedQr = path.join(out, "assets", "generated", "qr");
await fs.mkdir(generatedGallery, { recursive: true });
await fs.mkdir(generatedQr, { recursive: true });

const galleryDir = path.join(root, "assets", "gallery");
const galleryFiles = (await fs.readdir(galleryDir))
  .filter(name => /^image \(\d+\)\.jpg$/i.test(name))
  .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));

const widths = [360, 720, 1200, 1600];
const manifest = [];

for (const filename of galleryFiles) {
  const number = Number(filename.match(/\d+/)?.[0]);
  const source = path.join(galleryDir, filename);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) continue;

  const derivatives = {};
  for (const width of widths) {
    const actualWidth = Math.min(width, metadata.width);
    const actualHeight = Math.round(metadata.height * actualWidth / metadata.width);
    const outputName = `image-${String(number).padStart(2, "0")}-${width}.webp`;
    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width >= 1200 ? 80 : 76, effort: 5 })
      .toFile(path.join(generatedGallery, outputName));
    derivatives[width] = {
      src: `assets/generated/gallery/${outputName}`,
      width: actualWidth,
      height: actualHeight
    };
  }

  manifest.push({
    index: number,
    alt: `Red Deer Reavers photo ${number}`,
    original: `assets/gallery/${filename}`,
    width: metadata.width,
    height: metadata.height,
    derivatives
  });
}

await fs.writeFile(
  path.join(generatedGallery, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

const siteUrl = (process.env.SITE_URL || "https://dothecoolwip1.github.io/Reavers-Site/").replace(/\/+$/, "") + "/";
const qrTargets = {
  home: siteUrl,
  join: new URL("training.html#start", siteUrl).href,
  community: new URL("community.html#book", siteUrl).href,
  events: new URL("events.html", siteUrl).href
};

for (const [name, url] of Object.entries(qrTargets)) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 720
  });
  await fs.writeFile(path.join(generatedQr, `${name}.svg`), svg);
}
await fs.writeFile(path.join(generatedQr, "links.json"), JSON.stringify(qrTargets, null, 2));

const htmlFiles = publicFiles.filter(file => file.endsWith(".html"));
for (const file of htmlFiles) {
  const target = path.join(out, file);
  let html = await fs.readFile(target, "utf8");
  html = html.replace(
    /<img([^>]*?)src="assets\/gallery\/image \((\d+)\)\.jpg"([^>]*)>/g,
    (match, before, rawNumber, after) => {
      if (/\ssrcset=/.test(match)) return match;
      const number = String(Number(rawNumber)).padStart(2, "0");
      const srcset = widths.map(width => `assets/generated/gallery/image-${number}-${width}.webp ${width}w`).join(", ");
      return `<img${before}src="assets/gallery/image (${Number(rawNumber)}).jpg" srcset="${srcset}" sizes="(max-width: 759px) 100vw, 1180px"${after}>`;
    }
  );
  await fs.writeFile(target, html);
}

const fontFiles = [
  ["@fontsource-variable/grenze-gotisch", "grenze-gotisch-latin-wght-normal.woff2"],
  ["@fontsource-variable/cinzel", "cinzel-latin-wght-normal.woff2"],
  ...["400-normal", "400-italic", "500-normal", "700-normal", "800-normal"].map(w => ["@fontsource/alegreya-sans", `alegreya-sans-latin-${w}.woff2`])
];
const vendorCopies = [
  ...fontFiles.map(([pkg, file]) => [`node_modules/${pkg}/files/${file}`, `vendor/fonts/${file}`]),
  ["node_modules/@fontsource-variable/grenze-gotisch/LICENSE", "vendor/fonts/LICENSE-grenze-gotisch.txt"],
  ["node_modules/@fontsource-variable/cinzel/LICENSE", "vendor/fonts/LICENSE-cinzel.txt"],
  ["node_modules/@fontsource/alegreya-sans/LICENSE", "vendor/fonts/LICENSE-alegreya-sans.txt"],
  ["node_modules/photoswipe/dist", "vendor/photoswipe"],
  ["node_modules/sortablejs/Sortable.min.js", "vendor/sortable/Sortable.min.js"],
  ["node_modules/add-to-calendar-button/dist", "vendor/add-to-calendar-button/dist"]
];
for (const [from, to] of vendorCopies) {
  const source = path.join(root, from);
  const target = path.join(out, to);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const stat = await fs.stat(source);
  if (stat.isDirectory()) await fs.cp(source, target, { recursive: true });
  else await fs.copyFile(source, target);
}

console.log(`Built Reavers site: ${manifest.length} gallery images optimized, ${Object.keys(qrTargets).length} QR codes generated.`);

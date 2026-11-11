// Draws a QR code as a plain SVG that design tools (VectorCraft, Canva, Illustrator, Inkscape) open cleanly:
// a fixed width and height, a white background rectangle, and the dark modules as filled squares (one closed
// rectangle per run of dark modules in a row). No strokes, masks, CSS or fill rules for an editor to get wrong.
// Shared by the app's QR codes page and scripts/build-site.mjs (plain JavaScript so both can import it).
import QRCode from "qrcode";

/**
 * @param {string} text what the code holds (a link)
 * @param {{ logo?: string | null, margin?: number, px?: number }} [options]
 *   logo: an image address (best a data: URL) for the crest in a white badge in the middle. With a logo the code
 *   uses error correction level H, which still scans with up to 30% hidden; the badge covers about 6%.
 * @returns {string}
 */
export function qrSvg(text, { logo = null, margin = 2, px = 720 } = {}) {
  const { size, runs } = qrRuns(text, { logo: Boolean(logo), margin });
  const d = runs.map(([x, y, w]) => `M${x} ${y}h${w}v1h-${w}z`).join("");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" preserveAspectRatio="xMidYMid meet">`
    + `<rect x="0" y="0" width="${size}" height="${size}" fill="#ffffff"/>`
    + `<path d="${d}" fill="#000000"/>`;
  if (logo) {
    const fmt = v => +v.toFixed(2);
    const { badge, at, pad } = qrBadge(size);
    svg += `<rect x="${fmt(at)}" y="${fmt(at)}" width="${fmt(badge)}" height="${fmt(badge)}" rx="${fmt(badge * 0.18)}" fill="#ffffff"/>`
      + `<image x="${fmt(at + pad)}" y="${fmt(at + pad)}" width="${fmt(badge - 2 * pad)}" height="${fmt(badge - 2 * pad)}" href="${logo}" xlink:href="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return svg + "</svg>\n";
}

/**
 * The code as rows of dark runs, in module units including the quiet-zone margin: [x, y, width] each one module high.
 * @param {string} text
 * @param {{ logo?: boolean, margin?: number }} [options]
 * @returns {{ size: number, runs: [number, number, number][] }}
 */
export function qrRuns(text, { logo = false, margin = 2 } = {}) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: logo ? "H" : "M" });
  const n = modules.size;
  /** @type {[number, number, number][]} */
  const runs = [];
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!modules.get(y, x)) { x++; continue; }
      let run = 1;
      while (x + run < n && modules.get(y, x + run)) run++;
      runs.push([x + margin, y + margin, run]);
      x += run;
    }
  }
  return { size: n + margin * 2, runs };
}

/** Where the crest's white badge goes, in module units. @param {number} size */
export function qrBadge(size) {
  const badge = size * 0.24;
  return { badge, at: (size - badge) / 2, pad: badge * 0.1 };
}

/**
 * Drops the white background and the white badge behind the crest, for laying the code over a poster or shirt.
 * Only the dark squares and the crest stay; print it on something light so it still scans.
 * @param {string} svg
 * @returns {string}
 */
export function makeTransparent(svg) {
  return svg.replace(/<rect [^>]*fill="#ffffff"\/>/g, "");
}

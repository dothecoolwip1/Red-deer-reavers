// Helpers for the QR codes page: tidy what an admin types into a link a phone can open, and name the downloaded file.

/** Turns "reddeerreavers.com/events" or " https://x.ca " into a full web link, or explains why it can't be one. */
export function cleanLink(input: string): { url: string } | { error: string } {
  let text = input.trim();
  if (!text) return { error: "Enter the link the QR code should open." };
  if (/\s/.test(text)) return { error: "A link can't have spaces in it." };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) text = `https://${text.replace(/^\/+/, "")}`;
  let parsed: URL;
  try { parsed = new URL(text); } catch { return { error: "That doesn't look like a web address." }; }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { error: "Only web links (https://…) can go on a QR code here." };
  if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") return { error: "That doesn't look like a web address." };
  if (text.length > 2000) return { error: "That link is too long for a QR code." };
  return { url: text };
}

/** "Fight Night tickets!" → "reavers-fight-night-tickets-qr" */
export function qrFileName(title: string): string {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  return `reavers-${slug || "link"}-qr`;
}

/** Short form of a link for the card: no https://, no trailing slash. */
export const shortLink = (url: string) => url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

/**
 * Puts the club crest in a white badge in the middle of a QR code SVG (from the qrcode package).
 * The code must use error correction level H, which still scans with up to 30% hidden; the badge covers about 6%.
 * scripts/build-site.mjs does the same for the website codes; keep the two in step.
 */
export function addLogo(svg: string, logoHref: string): string {
  const size = Number(/viewBox="0 0 (\d+(?:\.\d+)?) /.exec(svg)?.[1]);
  if (!size) return svg;
  const badge = size * 0.24;
  const at = (size - badge) / 2;
  const pad = badge * 0.1;
  const fmt = (n: number) => +n.toFixed(2);
  const overlay = `<rect x="${fmt(at)}" y="${fmt(at)}" width="${fmt(badge)}" height="${fmt(badge)}" rx="${fmt(badge * 0.18)}" fill="#ffffff"/>`
    + `<image x="${fmt(at + pad)}" y="${fmt(at + pad)}" width="${fmt(badge - 2 * pad)}" height="${fmt(badge - 2 * pad)}" href="${logoHref}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace(/<\/svg>\s*$/, `${overlay}</svg>`);
}

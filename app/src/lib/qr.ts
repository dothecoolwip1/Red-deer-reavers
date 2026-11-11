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


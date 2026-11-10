// The BuhurtOS home server the members area and Team Admin already sign in to (assets/js/buhurtos-config.js).
// Keep these two values in step with that file.
// The URL and publishable key are public by design; every permission is enforced by the database.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://api-home.buhurtoshome.app";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkzNjQyNTkwLCJleHAiOjE5NTEzMjI1OTB9.f3LpnSfDwX5tVAJPYXAtBGSVtlJTAJE16xjvd_2V_D4";
export const TABLE_PREFIX = "reavers_app_";
export const RECEIPTS_BUCKET = "reavers-app-receipts";
export const SITE_MEDIA_BUCKET = "reavers-site-media";
export const SITE_URL = "https://reddeerreavers.com/";

/** Where the public pages live. The editor previews them in a frame; from app.reddeerreavers.com or local dev that is the real site. */
export function siteOrigin(): string {
  const { hostname, origin, port } = window.location;
  if (import.meta.env.VITE_SITE_ORIGIN) return import.meta.env.VITE_SITE_ORIGIN;
  if (hostname === "app.reddeerreavers.com" || port === "5173") return "https://reddeerreavers.com";
  return origin;
}

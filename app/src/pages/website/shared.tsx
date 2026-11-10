import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { SiteAction, SiteData } from "../../data/website";
import { Loading, errorText, useAction, useStore, useToast } from "../../ui";

/** Loads the website's records once and reloads after every change. */
export function useSite() {
  const store = useStore();
  const toast = useToast();
  const run = useAction();
  const [data, setData] = useState<SiteData | null>(null);
  const [failed, setFailed] = useState("");
  const reload = useCallback(async () => {
    try { setData(await store.website.get()); setFailed(""); } catch (e) { setFailed(errorText(e)); toast(errorText(e), true); }
  }, [store, toast]);
  useEffect(() => { void reload(); }, [reload]);
  const act = useCallback(
    (body: SiteAction, done?: string) => run(async () => { await store.website.act(body); await reload(); }, done),
    [run, store, reload]
  );
  return { data, failed, reload, act };
}

/** Shows the children only once the records are loaded and this account may change them. */
export function CaptainOnly({ data, failed, children }: { data: SiteData | null; failed: string; children: (d: SiteData) => ReactNode }) {
  if (!data) return failed ? <p className="banner">Could not load the website's records: {failed}</p> : <Loading />;
  if (!data.admin) return (
    <div className="card captain-note">
      <h2>Captains only</h2>
      <p>The website's calendar, practices, team page, inquiries and settings can only be changed by a Red Deer Reavers captain. This BuhurtOS account isn't one yet. Ask a captain to make you one on BuhurtOS, then reload.</p>
    </div>
  );
  return <>{children(data)}</>;
}

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "17:30:00" → "5:30 PM" */
export function clock(value: string | null | undefined) {
  if (!value) return "";
  const [h, m] = String(value).split(":").map(Number);
  if (Number.isNaN(h)) return String(value);
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
export const hhmm = (value: string | null | undefined) => (value ? String(value).slice(0, 5) : "");
export const longDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : "";
export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());

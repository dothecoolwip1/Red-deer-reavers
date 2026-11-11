import type { Role } from "./roles";

/** The staff pages an admin can give or take away per person. Kept in step with migration 20261111000000. */
export type PageId =
  | "attendance" | "ledger" | "budget" | "sales" | "dues" | "sponsors" | "grants" | "gear" | "compliance"
  | "site" | "calendar" | "team" | "practices" | "inquiries" | "site-settings" | "qr";
/** 0 = hidden, 1 = view only, 2 = full use. */
export type Level = 0 | 1 | 2;
export type Access = "none" | "view" | "edit";
export type PageLevels = Record<PageId, Level>;

export type PageInfo = {
  id: PageId; label: string; group: string;
  /** Whether the page has a read-only mode (money pages). Others are all or nothing. */
  viewOnly: boolean;
  /** Shown on the access screen when the page saves through BuhurtOS, which has its own rule. */
  note?: string;
};

const CAPTAIN = "Saving here still needs a Reavers captain on BuhurtOS; this only shows or hides the page.";
export const PAGES: PageInfo[] = [
  { id: "attendance", label: "Attendance", group: "Team", viewOnly: false },
  { id: "ledger", label: "Ledger", group: "Money", viewOnly: true },
  { id: "budget", label: "Budget", group: "Money", viewOnly: true },
  { id: "sales", label: "Square sales", group: "Money", viewOnly: true },
  { id: "dues", label: "Dues", group: "Money", viewOnly: true },
  { id: "sponsors", label: "Sponsors", group: "Growth", viewOnly: false },
  { id: "grants", label: "Grants", group: "Growth", viewOnly: false },
  { id: "gear", label: "Armory", group: "Safety", viewOnly: false },
  { id: "compliance", label: "Deadlines", group: "Society", viewOnly: false },
  { id: "calendar", label: "Calendar", group: "Website", viewOnly: false, note: CAPTAIN },
  { id: "team", label: "Team page", group: "Website", viewOnly: false, note: CAPTAIN },
  { id: "practices", label: "Practices", group: "Website", viewOnly: false, note: CAPTAIN },
  { id: "inquiries", label: "Inquiries", group: "Website", viewOnly: false, note: CAPTAIN },
  { id: "site", label: "Site editor", group: "Website", viewOnly: false },
  { id: "qr", label: "QR codes", group: "Website", viewOnly: false },
  { id: "site-settings", label: "Site settings", group: "Website", viewOnly: false, note: CAPTAIN }
];
export const PAGE_IDS = PAGES.map(p => p.id);
const MONEY: PageId[] = ["ledger", "budget", "sales", "dues"];

export const toLevel = (a: Access): Level => (a === "edit" ? 2 : a === "view" ? 1 : 0);
export const toAccess = (l: Level): Access => (l === 2 ? "edit" : l === 1 ? "view" : "none");

/** What a role gets with no override: treasury everything, the executive views money and uses the rest, members none. */
export function defaultLevel(role: Role, page: PageId): Level {
  if (role === "finance") return 2;
  if (role === "exec") return MONEY.includes(page) ? 1 : 2;
  return 0;
}

/** The same rule as private.reavers_app_page_level: treasury can't be overridden (so admins can't lock themselves out). */
export function levelFor(role: Role, page: PageId, override?: Access | null): Level {
  if (role === "finance") return 2;
  if (role === "none") return 0;
  return override ? toLevel(override) : defaultLevel(role, page);
}

export function levelsFor(role: Role, overrides: Partial<Record<PageId, Access>> = {}): PageLevels {
  return Object.fromEntries(PAGE_IDS.map(p => [p, levelFor(role, p, overrides[p])])) as PageLevels;
}

/** Reads reavers_app_my_pages(); anything missing or unknown falls back to the role's default. */
export function parseLevels(role: Role, raw: unknown): PageLevels {
  const base = levelsFor(role);
  if (!raw || typeof raw !== "object") return base;
  for (const p of PAGE_IDS) {
    const v = (raw as Record<string, unknown>)[p];
    if (v === 0 || v === 1 || v === 2) base[p] = v;
  }
  return base;
}

/** The choices an admin has for a page: money pages can be view-only, the rest are on or off. */
export const choicesFor = (page: PageInfo): Access[] => (page.viewOnly ? ["none", "view", "edit"] : ["none", "edit"]);
export const accessLabel = (a: Access, page: PageInfo) => (a === "none" ? "No access" : a === "view" ? "View" : page.viewOnly ? "Edit" : "Use");

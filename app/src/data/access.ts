import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "../lib/roles";
import type { Access, PageId } from "../lib/pages";

// Who can see and use each staff page. Treasury sets overrides in reavers_app_page_access; the database applies them to
// every page's tables (migration 20261111000000_reavers_app_page_access.sql), so this screen is not just hiding menu items.

export type AccessPerson = { user_id: string; name: string; role: Role };
export type PageAccessRow = { user_id: string; page: PageId; access: Access; set_at?: string };

export interface AccessApi {
  /** Everyone on the Reavers team with a BuhurtOS account. Treasury only. */
  people(): Promise<AccessPerson[]>;
  /** Every override that has been set. */
  rows(): Promise<PageAccessRow[]>;
  /** Sets one person's access to one page; null puts it back to what their role gives. */
  set(userId: string, page: PageId, access: Access | null): Promise<void>;
}

function check<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
  return r.data;
}

export function liveAccess(sb: () => SupabaseClient): AccessApi {
  const table = () => sb().from("reavers_app_page_access");
  return {
    async people() { return (check(await sb().rpc("reavers_app_access_people")) || []) as AccessPerson[]; },
    async rows() { return (check(await table().select("user_id,page,access,set_at").limit(5000)) || []) as PageAccessRow[]; },
    async set(userId, page, access) {
      if (access === null) check(await table().delete().eq("user_id", userId).eq("page", page));
      else check(await table().upsert({ user_id: userId, page, access, set_at: new Date().toISOString() }, { onConflict: "user_id,page" }));
    }
  };
}

const DEMO_KEY = "reavers-app-access-demo-v1";
const DEMO_PEOPLE: AccessPerson[] = [
  { user_id: "demo-user", name: "Demo Treasurer", role: "finance" },
  { user_id: "demo-captain", name: "Bjorn Halvorsen", role: "finance" },
  { user_id: "demo-secretary", name: "Astrid Lindqvist", role: "exec" },
  { user_id: "demo-quartermaster", name: "Erik Thorsen", role: "exec" },
  { user_id: "demo-member-1", name: "Freya Nilsen", role: "member" },
  { user_id: "demo-member-2", name: "Leif Magnusson", role: "member" },
  { user_id: "demo-member-3", name: "Sigrid Olsen", role: "member" }
];

export function demoAccess(): AccessApi {
  let rows: PageAccessRow[] = [
    { user_id: "demo-member-1", page: "sponsors", access: "edit" },
    { user_id: "demo-member-1", page: "site", access: "edit" },
    { user_id: "demo-quartermaster", page: "ledger", access: "none" },
    { user_id: "demo-quartermaster", page: "dues", access: "none" }
  ];
  try { const saved = localStorage.getItem(DEMO_KEY); if (saved) rows = JSON.parse(saved); } catch { /* sample data only */ }
  const save = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); } catch { /* ignore */ } };
  return {
    async people() { return structuredClone(DEMO_PEOPLE); },
    async rows() { return structuredClone(rows); },
    async set(userId, page, access) {
      rows = rows.filter(r => !(r.user_id === userId && r.page === page));
      if (access !== null) rows.push({ user_id: userId, page, access, set_at: new Date().toISOString() });
      save();
    }
  };
}

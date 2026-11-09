import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RECEIPTS_BUCKET, SUPABASE_KEY, SUPABASE_URL, TABLE_PREFIX } from "./config";
import type { Id, Session, Store, TableName, Tables } from "./types";
import { roleFrom, type Role } from "../lib/roles";

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }
  });
  return client;
}

const table = (name: TableName) => supabase().from(TABLE_PREFIX + name);
const ORDER: Partial<Record<TableName, [string, boolean]>> = {
  transactions: ["date", false], reimbursements: ["created_at", false], compliance: ["due", true], grants: ["deadline", true],
  sponsors: ["name", true], gear: ["name", true], incidents: ["date", false], waivers: ["signed_at", false],
  budgets: ["category", true], payment_links: ["title", true], gear_log: ["at", false], sponsor_deliverables: ["due", true]
};

function fail(error: { message: string; code?: string } | null): void {
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
}

/** True when the reavers_app_* migration has not been applied to the database yet. */
export const isMissingSetup = (e: unknown) => {
  const code = (e as { code?: string })?.code;
  return code === "PGRST202" || code === "PGRST205" || code === "42883" || code === "42P01";
};

export async function liveSession(): Promise<Session | null> {
  const { data } = await supabase().auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const { data: role, error } = await supabase().rpc("reavers_app_my_role");
  fail(error);
  const meta = user.user_metadata || {};
  return {
    mode: "live",
    userId: user.id,
    email: user.email || "",
    name: meta.full_name || meta.name || meta.user_name || user.email || "Member",
    role: (["finance", "exec", "member"].includes(role) ? role : roleFrom({ finance: false, exec: false, member: false })) as Role
  };
}

export function liveStore(session: Session): Store {
  return {
    session,
    async list<T extends TableName>(name: T) {
      const order = ORDER[name];
      let query = table(name).select("*");
      if (order) query = query.order(order[0], { ascending: order[1], nullsFirst: false });
      const { data, error } = await query.limit(5000);
      fail(error);
      return (data || []) as Tables[T][];
    },
    async insert<T extends TableName>(name: T, row: Partial<Tables[T]>) {
      const { data, error } = await table(name).insert(row as never).select().single();
      fail(error);
      return data as Tables[T];
    },
    async insertMany(name, rows) {
      if (!rows.length) return 0;
      const { error } = await table(name).insert(rows as never);
      fail(error);
      return rows.length;
    },
    async update(name, id, patch) {
      const { error } = await table(name).update(patch as never).eq("id", id);
      fail(error);
    },
    async remove(name, id) {
      const { error } = await table(name).delete().eq("id", id);
      fail(error);
    },
    async approveClaim(id: Id) {
      const { data, error } = await supabase().rpc("reavers_app_approve_reimbursement", { p_id: id });
      fail(error);
      return String(data);
    },
    async payClaim(id, paidOn) {
      const { error } = await supabase().rpc("reavers_app_pay_reimbursement", { p_id: id, p_paid_on: paidOn });
      fail(error);
    },
    async rejectClaim(id, note) {
      const { error } = await supabase().rpc("reavers_app_reject_reimbursement", { p_id: id, p_note: note });
      fail(error);
    },
    async uploadReceipt(file) {
      const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80);
      const path = `${session.userId}/${Date.now()}-${safe}`;
      const { error } = await supabase().storage.from(RECEIPTS_BUCKET).upload(path, file, { contentType: file.type });
      fail(error);
      return path;
    },
    async receiptUrl(path) {
      const { data, error } = await supabase().storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 300);
      return error ? null : data.signedUrl;
    },
    async signOut() {
      await supabase().auth.signOut();
    }
  };
}

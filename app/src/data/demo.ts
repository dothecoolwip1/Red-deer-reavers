import type { Id, Session, Store, TableName, Tables } from "./types";
import { approvalState, canApprove } from "../lib/reimburse";
import type { Role } from "../lib/roles";
import { demoWebsite } from "./website";

// Sample data for trying the app without signing in or before the database is set up. Nothing here reaches the database.
const KEY = "reavers-app-demo-v1";
const ME = "demo-user";
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const year = today.getFullYear();
let counter = 0;
const id = () => `demo-${Date.now().toString(36)}-${(counter++).toString(36)}`;

type Db = { [K in TableName]: Tables[K][] };

function seed(): Db {
  const tx = (offset: number, description: string, amount_cents: number, category: string, source: "manual" | "csv" | "stripe" = "csv") =>
    ({ id: id(), date: day(offset), description, amount_cents, category, account: source === "stripe" ? "Stripe" : "Chequing", notes: null, receipt_path: null, source });
  return {
    transactions: [
      tx(-2, "Stripe: Fighter membership from Sam (sample)", 24000, "Dues", "stripe"),
      tx(-5, "Gym rent", -40000, "Venue"),
      tx(-9, "e-Transfer from Prairie Iron Works", 150000, "Sponsorship"),
      tx(-14, "Armour Bazaar: 2 loaner helmets", -86000, "Gear"),
      tx(-20, "Insurance premium", -62000, "Insurance"),
      tx(-33, "Fight Night tickets", 118000, "Fundraising"),
      tx(-36, "Gym rent", -40000, "Venue"),
      tx(-41, "Fuel to Calgary tournament", -18500, "Travel", "manual"),
      tx(-60, "Opening balance", 420000, "Opening balance", "manual")
    ],
    budgets: [
      { id: id(), year, category: "Dues", kind: "income", amount_cents: 360000 },
      { id: id(), year, category: "Sponsorship", kind: "income", amount_cents: 600000 },
      { id: id(), year, category: "Fundraising", kind: "income", amount_cents: 300000 },
      { id: id(), year, category: "Venue", kind: "expense", amount_cents: 480000 },
      { id: id(), year, category: "Gear", kind: "expense", amount_cents: 250000 },
      { id: id(), year, category: "Travel", kind: "expense", amount_cents: 200000 },
      { id: id(), year, category: "Insurance", kind: "expense", amount_cents: 70000 }
    ],
    payment_links: [
      { id: id(), title: "Fighter membership (yearly)", description: "Includes practice and loaner kit", url: "https://buy.stripe.com/test_reavers_dues", amount_cents: 24000, kind: "dues", active: true },
      { id: id(), title: "Support the Reavers", description: "Any amount, any time", url: "https://buy.stripe.com/test_reavers_donate", amount_cents: null, kind: "donation", active: true }
    ],
    reimbursements: [
      { id: id(), submitted_by: "demo-sam", submitter_name: "Sam (sample)", description: "Hockey tape and zip ties", amount_cents: 4280, category: "Gear", spent_on: day(-3), receipt_path: null, status: "submitted", decision_note: null },
      { id: id(), submitted_by: "demo-alex", submitter_name: "Alex (sample)", description: "Hotel deposit, Calgary", amount_cents: 31000, category: "Travel", spent_on: day(-6), receipt_path: null, status: "submitted", decision_note: null }
    ],
    reimbursement_approvals: [],
    sponsors: [
      { id: id(), name: "Prairie Iron Works (sample)", contact_name: "Dana", email: null, phone: null, website: null, stage: "signed", tier: "Knight", value_cents: 150000, in_kind: false, next_follow_up: day(45), renews_on: day(300), notes: "Logo on tabards" },
      { id: id(), name: "Gaetz Ave Gym (sample)", contact_name: null, email: null, phone: null, website: null, stage: "proposal", tier: "Squire", value_cents: 50000, in_kind: true, next_follow_up: day(3), renews_on: null, notes: "Offering free mat time" },
      { id: id(), name: "Central Alberta Welding (sample)", contact_name: null, email: null, phone: null, website: null, stage: "contacted", tier: null, value_cents: null, in_kind: false, next_follow_up: day(-1), renews_on: null, notes: null }
    ],
    sponsor_deliverables: [],
    grants: [
      { id: id(), name: "Community Initiatives Program (sample)", funder: "Government of Alberta", stage: "drafting", amount_cents: 2500000, deadline: day(40), report_due: null, link: null, notes: "Loaner armour for new fighters" }
    ],
    compliance: [
      { id: id(), title: "Society annual return", authority: "Alberta Corporate Registry", due: day(18), recurrence: "yearly", owner: "Secretary", done_on: null, link: null, notes: null },
      { id: id(), title: "Liability insurance renewal", authority: "Insurer", due: day(52), recurrence: "yearly", owner: "Treasurer", done_on: null, link: null, notes: null },
      { id: id(), title: "50/50 licence report", authority: "AGLC", due: day(-4), recurrence: "once", owner: "Treasurer", done_on: null, link: null, notes: null }
    ],
    gear: [
      { id: id(), code: "RDR-H01", name: "Loaner helmet, size L", kind: "Helmet", condition: "good", last_inspected: day(-30), holder_name: "Jordan (sample)", holder_user: null, checked_out_on: day(-10), notes: null },
      { id: id(), code: "RDR-S03", name: "Heater shield", kind: "Shield", condition: "worn", last_inspected: day(-200), holder_name: null, holder_user: null, checked_out_on: null, notes: "Re-strap before next season" },
      { id: id(), code: "RDR-G02", name: "Gauntlets, pair", kind: "Gauntlets", condition: "good", last_inspected: day(-12), holder_name: null, holder_user: null, checked_out_on: null, notes: null }
    ],
    gear_log: [],
    waivers: [],
    incidents: [],
    site_content: [],
    site_content_history: []
  };
}

function load(): Db {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { ...seed(), ...JSON.parse(saved) };
  } catch { /* private mode or blocked storage: fall back to fresh sample data */ }
  return seed();
}

export function demoStore(role: Role = "finance"): Store {
  const db = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  const session: Session = { mode: "demo", userId: ME, name: "Demo Treasurer", email: "demo@reddeerreavers.com", role };
  const rows = <T extends TableName>(t: T) => db[t] as Tables[T][];
  const logSite = (row: Tables["site_content"], previous: string | null) => {
    db.site_content_history.unshift({ id: id(), page: row.page, key: row.key, kind: row.kind, value: row.value ?? null, previous, original: row.original, changed_at: new Date().toISOString() });
  };
  return {
    session,
    async list(t) {
      const list = structuredClone(rows(t));
      if (t === "transactions") (list as Tables["transactions"][]).sort((a, b) => b.date.localeCompare(a.date));
      return list;
    },
    async insert(t, row) {
      const full = { id: id(), ...row } as Tables[typeof t];
      if (t === "site_content") logSite(full as Tables["site_content"], null);
      if (t === "waivers") Object.assign(full, { user_id: ME, signed_at: new Date().toISOString() });
      if (t === "reimbursements") Object.assign(full, { submitted_by: ME, status: "submitted" });
      rows(t).unshift(full);
      save();
      return structuredClone(full);
    },
    async insertMany(t, list) {
      for (const row of list) rows(t).unshift({ id: id(), ...row } as Tables[typeof t]);
      save();
      return list.length;
    },
    async update(t, rowId, patch) {
      const row = rows(t).find(r => (r as { id: Id }).id === rowId);
      if (t === "site_content" && row) logSite({ ...(row as Tables["site_content"]), ...(patch as object) }, (row as Tables["site_content"]).value);
      if (row) Object.assign(row, patch);
      save();
    },
    async remove(t, rowId) {
      const gone = t === "site_content" ? db.site_content.find(r => r.id === rowId) : undefined;
      if (gone) logSite({ ...gone, value: null as unknown as string }, gone.value);
      (db[t] as { id: Id }[]) = (db[t] as { id: Id }[]).filter(r => r.id !== rowId);
      save();
    },
    async approveClaim(claimId) {
      const claim = db.reimbursements.find(c => c.id === claimId);
      if (!claim) throw new Error("Claim not found");
      const approvers = db.reimbursement_approvals.filter(a => a.reimbursement_id === claimId).map(a => a.approver);
      // Demo has one person, so a second approval is simulated as another treasurer.
      const me = approvers.includes(ME) ? "demo-second-approver" : ME;
      if (!canApprove(claim, me, approvers)) throw new Error("You cannot approve this claim");
      db.reimbursement_approvals.push({ reimbursement_id: claimId, approver: me });
      if (approvalState(claim.amount_cents, [...approvers, me]).approved) claim.status = "approved";
      save();
      return claim.status;
    },
    async payClaim(claimId, paidOn) {
      const claim = db.reimbursements.find(c => c.id === claimId);
      if (!claim || claim.status !== "approved") throw new Error("Only approved claims can be paid");
      db.transactions.unshift({
        id: id(), date: paidOn, description: `Reimbursement: ${claim.submitter_name} - ${claim.description}`,
        amount_cents: -claim.amount_cents, category: claim.category, account: "Chequing", notes: null,
        receipt_path: claim.receipt_path, source: "reimbursement"
      });
      claim.status = "paid";
      save();
    },
    async rejectClaim(claimId, note) {
      const claim = db.reimbursements.find(c => c.id === claimId);
      if (claim) Object.assign(claim, { status: "rejected", decision_note: note });
      save();
    },
    async uploadReceipt(file) { return `demo/${file.name}`; },
    async uploadSiteImage(file) {
      // Sample mode keeps the picture in the browser only (the live site accepts only https addresses).
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the image"));
        reader.readAsDataURL(file);
      });
    },
    async receiptUrl() { return null; },
    website: demoWebsite(),
    async signOut() { try { localStorage.removeItem(KEY); localStorage.removeItem("reavers-app-website-demo-v1"); } catch { /* ignore */ } }
  };
}

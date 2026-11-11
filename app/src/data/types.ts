import type { Role } from "../lib/roles";
import type { ClaimStatus } from "../lib/reimburse";
import type { Recurrence } from "../lib/compliance";
import type { WebsiteApi } from "./website";
import type { AttendanceApi } from "./attendance";
import type { AccessApi } from "./access";
import type { PageLevels } from "../lib/pages";
import type { Kind, PaymentItem, PaymentKind } from "../lib/square";
import type { RegistrationStatus, TicketKind } from "../lib/events";

export type Id = string;
export type Transaction = {
  id: Id; date: string; description: string; amount_cents: number; category: string | null; account: string;
  notes: string | null; receipt_path: string | null; source: "manual" | "csv" | "stripe" | "square" | "reimbursement"; external_id?: string | null; created_at?: string;
};
export type Budget = { id: Id; year: number; category: string; kind: "income" | "expense"; amount_cents: number };
export type PaymentLink = {
  id: Id; title: string; description: string | null; url: string; amount_cents: number | null;
  kind: "dues" | "entry" | "sponsorship" | "donation" | "merch" | "other"; active: boolean;
};
export type Reimbursement = {
  id: Id; submitted_by: string; submitter_name: string; description: string; amount_cents: number; category: string | null;
  spent_on: string; receipt_path: string | null; status: ClaimStatus; decision_note: string | null; created_at?: string;
};
export type Approval = { reimbursement_id: Id; approver: string };
export type Sponsor = {
  id: Id; name: string; contact_name: string | null; email: string | null; phone: string | null; website: string | null;
  stage: "prospect" | "contacted" | "meeting" | "proposal" | "signed" | "renewed" | "lost"; tier: string | null;
  value_cents: number | null; in_kind: boolean; next_follow_up: string | null; renews_on: string | null; notes: string | null;
};
export type Deliverable = { id: Id; sponsor_id: Id; title: string; due: string | null; done_on: string | null };
export type Grant = {
  id: Id; name: string; funder: string | null;
  stage: "researching" | "drafting" | "submitted" | "awarded" | "declined" | "reporting" | "closed";
  amount_cents: number | null; deadline: string | null; report_due: string | null; link: string | null; notes: string | null;
};
export type Compliance = {
  id: Id; title: string; authority: string | null; due: string; recurrence: Recurrence; owner: string | null;
  done_on: string | null; link: string | null; notes: string | null;
};
export type Gear = {
  id: Id; code: string | null; name: string; kind: string | null; condition: "new" | "good" | "worn" | "repair" | "retired";
  last_inspected: string | null; holder_name: string | null; holder_user: string | null; checked_out_on: string | null; notes: string | null;
};
export type GearLog = { id: Id; gear_id: Id; action: "out" | "in" | "inspected" | "note"; person: string | null; note: string | null; at: string };
export type Waiver = {
  id: Id; user_id: string; season: number; full_name: string; signed_name: string; is_minor: boolean; guardian_name: string | null;
  emergency_contact: string | null; emergency_phone: string | null; medical_notes: string | null; signed_at: string;
};
export type Incident = {
  id: Id; date: string; person: string; description: string; treatment: string | null; cleared_to_fight: boolean; reported_by: string | null;
};

export type SquareItem = {
  id: Id; title: string; kind: Kind; description: string | null; price_cents: number; max_quantity: number; public: boolean; active: boolean; sort_order: number;
};
export type SquarePaymentRow = {
  id: Id; square_payment_id: string; square_order_id: string | null; paid_at: string; status: string; amount_cents: number; fee_cents: number;
  refunded_cents: number; kind: PaymentKind; summary: string; items: PaymentItem[]; channel: "online" | "in_person";
  buyer_name: string | null; buyer_email: string | null; member_user: string | null; dues_month: string | null; receipt_url: string | null;
};
export type DuesMethod = "square" | "cash" | "etransfer" | "waived" | "other";
export type Dues = {
  id: Id; member_key: string; member_name: string; member_user: string | null; month: string; amount_cents: number; method: DuesMethod;
  paid_on: string; square_payment_id: string | null; note: string | null;
};
export type DuesExemption = {
  id: Id; member_key: string; member_name: string; reason: string | null; starts_month: string; ends_month: string | null;
};
export type QrCode = { id: Id; title: string; note: string | null; url: string; created_at?: string };
export type CheckoutRequest = { item_id: Id; quantity: number; buyer_name: string; buyer_email: string; dues_month?: string | null; return_url: string };

/** Sign-ups for a website calendar event (the event itself lives in BuhurtOS's reavers_site; event_id is its id). */
export type EventSignup = {
  id: Id; event_id: string; title: string; event_date: string; start_time: string | null; location: string | null; intro: string | null;
  open: boolean; closes_on: string | null; capacity: number | null; ask_phone: boolean; ask_club: boolean; created_at?: string;
};
export type EventTicket = {
  id: Id; signup_id: Id; title: string; kind: TicketKind; description: string | null; price_cents: number; capacity: number | null;
  max_per_order: number; active: boolean; sort_order: number;
};
export type EventRegistration = {
  id: Id; signup_id: Id; ticket_id: Id | null; ticket_title: string; kind: TicketKind; quantity: number; amount_cents: number;
  name: string; email: string | null; phone: string | null; club: string | null; note: string | null; status: RegistrationStatus;
  paid_via: "square" | "cash" | "etransfer" | "other" | null; square_order_id: string | null; square_payment_id: string | null;
  paid_at: string | null; checked_in_at: string | null; created_at: string;
};
/** What the public sign-up page gets from reavers_app_event_public(): no names, only spots left. */
export type PublicTicket = { id: Id; title: string; kind: TicketKind; description: string | null; price_cents: number; max_per_order: number; spots_left: number | null };
export type PublicSignup = {
  id: Id; event_id: string; title: string; event_date: string; start_time: string | null; location: string | null; intro: string | null;
  ask_phone: boolean; ask_club: boolean; closes_on: string; open: boolean; spots_left: number | null; tickets: PublicTicket[];
};
export type SignupForm = {
  ticket_id: Id; quantity: number; name: string; email: string; phone?: string | null; club?: string | null; note?: string | null; return_url: string;
};
export type RegistrationCheck = { status: RegistrationStatus; ticket: string; quantity: number; first_name: string; event_id: string; title: string };

export type SiteContent = {
  id: Id; page: string; key: string; kind: "text" | "image"; value: string; original: string; updated_at?: string; updated_by?: string | null;
};
export type SiteHistory = {
  id: Id; page: string; key: string; kind: "text" | "image"; value: string | null; previous: string | null; original: string; changed_at: string;
};

export type Tables = {
  transactions: Transaction; budgets: Budget; payment_links: PaymentLink; reimbursements: Reimbursement;
  reimbursement_approvals: Approval; sponsors: Sponsor; sponsor_deliverables: Deliverable; grants: Grant;
  compliance: Compliance; gear: Gear; gear_log: GearLog; waivers: Waiver; incidents: Incident;
  site_content: SiteContent; site_content_history: SiteHistory;
  square_items: SquareItem; square_payments: SquarePaymentRow; dues: Dues; dues_exemptions: DuesExemption;
  qr_codes: QrCode;
  event_signups: EventSignup; event_tickets: EventTicket; event_registrations: EventRegistration;
};
export type TableName = keyof Tables;

export type Session = {
  mode: "live" | "demo"; userId: string; name: string; email: string; role: Role;
  /** What this person can do on each staff page (role default, or what an admin set on the Page access screen). */
  pages: PageLevels;
};

/** Everything the screens need from the database. Two implementations: Supabase (live) and in-browser sample data (demo). */
export interface Store {
  session: Session;
  list<T extends TableName>(table: T): Promise<Tables[T][]>;
  insert<T extends TableName>(table: T, row: Partial<Tables[T]>): Promise<Tables[T]>;
  insertMany<T extends TableName>(table: T, rows: Partial<Tables[T]>[]): Promise<number>;
  update<T extends TableName>(table: T, id: Id, patch: Partial<Tables[T]>): Promise<void>;
  remove(table: TableName, id: Id): Promise<void>;
  approveClaim(id: Id): Promise<string>;
  payClaim(id: Id, paidOn: string): Promise<void>;
  rejectClaim(id: Id, note: string): Promise<void>;
  uploadReceipt(file: File): Promise<string>;
  receiptUrl(path: string): Promise<string | null>;
  /** Uploads an image for the public website and returns its public address. */
  uploadSiteImage(file: File): Promise<string>;
  /** The public website's calendar, practices, team page, inquiries and settings (what the old /admin page managed). */
  website: WebsiteApi;
  /** Who shows up to practices, tournaments, events and fundraisers, and the 3-month no-show policy. */
  attendance: AttendanceApi;
  /** Who can see and use each staff page (treasury manages it). */
  access: AccessApi;
  /** Starts a Square checkout and returns the address of Square's payment page. */
  checkout(req: CheckoutRequest): Promise<string>;
  /** Treasury re-labels what a Square payment was for; its ledger lines follow. */
  setPaymentKind(id: Id, kind: Kind): Promise<void>;
  signOut(): Promise<void>;
}

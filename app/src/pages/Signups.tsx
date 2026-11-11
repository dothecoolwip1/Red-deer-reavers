import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { EventRegistration, EventSignup, EventTicket, Tables } from "../data/types";
import type { SiteEvent } from "../data/website";
import { STATUS_LABEL, TICKET_KINDS, TICKET_KIND_LABEL, isComing, registrationTotals, type RegistrationStatus } from "../lib/events";
import { formatMoney, parseMoney } from "../lib/money";
import { Empty, Loading, Modal, Money, Page, Pill, RecordForm, RecordList, downloadCsv, todayIso, useAction, usePage, useStore, useTable } from "../ui";
import { clock, hhmm, longDate, useSite } from "./website/shared";

/** Where the public sign-up page for a calendar event lives (no sign-in needed). */
export const signupUrl = (eventId: string) => `${window.location.origin}${window.location.pathname}#/events/${encodeURIComponent(eventId)}`;

const TONE: Record<RegistrationStatus, string> = { paid: "done", free: "done", pending: "soon", cancelled: "", refunded: "overdue" };

/** Admin side of event sign-ups: which calendar events take sign-ups, their tickets, and everyone who signed up. */
export function Signups() {
  const signups = useTable("event_signups");
  const tickets = useTable("event_tickets");
  const regs = useTable("event_registrations");
  const { data } = useSite();
  const [params, setParams] = useSearchParams();
  const selected = (signups.rows || []).find(s => s.id === params.get("event"));
  const reloadAll = async () => { await Promise.all([signups.reload(), tickets.reload(), regs.reload()]); };

  if (!signups.rows || !tickets.rows || !regs.rows) return <Page title="Event sign-ups"><Loading /></Page>;
  if (selected) return (
    <SignupDetail signup={selected} event={data?.events.find(e => e.id === selected.event_id)}
      tickets={tickets.rows.filter(t => t.signup_id === selected.id)} regs={regs.rows.filter(r => r.signup_id === selected.id)}
      reloadTickets={tickets.reload} reloadRegs={regs.reload} reloadSignups={signups.reload} onBack={() => setParams({})} />);
  return <SignupList signups={signups.rows} tickets={tickets.rows} regs={regs.rows} events={data?.events || null} reload={reloadAll} open={id => setParams({ event: id })} />;
}

function SignupList({ signups, tickets, regs, events, reload, open }: {
  signups: EventSignup[]; tickets: EventTicket[]; regs: EventRegistration[]; events: SiteEvent[] | null; reload: () => Promise<void>; open: (id: string) => void;
}) {
  const store = useStore();
  const run = useAction();
  const canEdit = usePage("calendar") >= 2;
  const items = useTable("square_items");
  const today = todayIso();
  const byEvent = new Map(signups.map(s => [s.event_id, s]));
  const upcoming = (events || []).filter(e => e.event_date >= today && e.is_public);
  const orphans = signups.filter(s => !upcoming.some(e => e.id === s.event_id)).sort((a, b) => b.event_date.localeCompare(a.event_date));

  async function setUp(e: SiteEvent) {
    // Starts from the club's Square prices when they're set up (Tournament registration, Event visitor fee).
    const price = (kind: string, fallback: number) => (items.rows || []).find(i => i.kind === kind && i.active)?.price_cents ?? fallback;
    let made: EventSignup | null = null;
    const ok = await run(async () => {
      made = await store.insert("event_signups", {
        event_id: e.id, title: e.title, event_date: e.event_date, start_time: hhmm(e.start_time) || null, location: e.location, intro: e.details,
        open: true, closes_on: null, capacity: null, ask_phone: false, ask_club: e.event_type === "tournament"
      });
      const first: Partial<EventTicket>[] = e.event_type === "tournament"
        ? [{ title: "Fighter registration", kind: "tournament", price_cents: price("tournament", 4000), max_per_order: 1, sort_order: 1 },
           { title: "Visitor", kind: "visitor", price_cents: price("visitor", 1000), max_per_order: 6, sort_order: 2 }]
        : [{ title: "Visitor", kind: "visitor", price_cents: price("visitor", 1000), max_per_order: 6, sort_order: 1 }];
      await store.insertMany("event_tickets", first.map(t => ({ ...t, signup_id: made!.id, active: true, capacity: null, description: null })));
    }, "Sign-ups set up. Check the tickets and prices, then share the link.");
    if (ok && made) { await reload(); open((made as EventSignup).id); }
  }

  const row = (s: EventSignup | undefined, e: SiteEvent | undefined) => {
    const mine = s ? regs.filter(r => r.signup_id === s.id) : [];
    const t = registrationTotals(mine);
    const title = e?.title || s?.title || "";
    const date = e?.event_date || s?.event_date || "";
    const closed = s && (!s.open || (s.closes_on || s.event_date) < today);
    return (
      <li key={s?.id || e?.id}>
        <div>
          <strong>{title}</strong>
          <small className="muted block">{longDate(date)}{e?.location ? ` · ${e.location}` : s?.location ? ` · ${s.location}` : ""}</small>
          <span className="tags">
            {!s ? <Pill>Not taking sign-ups</Pill> : closed ? <Pill tone="soon">Closed</Pill> : <Pill tone="done">Open</Pill>}
            {s && <> <Pill>{t.people} coming</Pill> {t.squareCents + t.doorCents > 0 && <Pill>{formatMoney(t.squareCents + t.doorCents)} taken</Pill>}
              {" "}{tickets.filter(x => x.signup_id === s.id && x.active).length === 0 && <Pill tone="overdue">no tickets</Pill>}</>}
          </span>
        </div>
        <div className="row-actions">
          {s ? <button className="primary" onClick={() => open(s.id)}>Open</button>
            : canEdit && e && <button onClick={() => void setUp(e)}>Set up sign-ups</button>}
        </div>
      </li>);
  };

  return (
    <Page title="Event sign-ups" intro={<>Let people register, buy tickets or volunteer for the website's events. Paid tickets go through Square and land in the books by themselves; free ones need no payment. Everything open for sign-up is listed at <a href={`${window.location.pathname}#/events`} target="_blank" rel="noopener">the public events page</a>.</>}>
      <section className="card">
        <h2>Upcoming public events</h2>
        {events === null ? <Loading /> : upcoming.length === 0
          ? <Empty>No upcoming public events in the calendar. Add one under Website → Calendar, then set up its sign-ups here.</Empty>
          : <ul className="rows">{upcoming.map(e => row(byEvent.get(e.id), e))}</ul>}
      </section>
      {orphans.length > 0 && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Past and other events</h2>
          <p className="muted small">Events that have finished, are hidden from the website, or were removed from the calendar. Their sign-ups are kept.</p>
          <ul className="rows">{orphans.map(s => row(s, undefined))}</ul>
        </section>)}
    </Page>
  );
}

function SignupDetail({ signup, event, tickets, regs, reloadTickets, reloadRegs, reloadSignups, onBack }: {
  signup: EventSignup; event: SiteEvent | undefined; tickets: EventTicket[]; regs: EventRegistration[];
  reloadTickets: () => Promise<void>; reloadRegs: () => Promise<void>; reloadSignups: () => Promise<void>; onBack: () => void;
}) {
  const store = useStore();
  const run = useAction();
  const canEdit = usePage("calendar") >= 2;
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"coming" | "all" | "pending">("coming");
  const [settings, setSettings] = useState(false);
  const [walkUp, setWalkUp] = useState(false);
  const totals = registrationTotals(regs);
  const url = signupUrl(signup.event_id);

  // Keeps the copy of the calendar's title, date and place in step when the event is edited in the calendar.
  useEffect(() => {
    if (!event || !canEdit) return;
    const now = { title: event.title, event_date: event.event_date, start_time: hhmm(event.start_time) || null, location: event.location };
    if (now.title !== signup.title || now.event_date !== signup.event_date || (now.start_time || null) !== (signup.start_time || null) || (now.location || null) !== (signup.location || null))
      void store.update("event_signups", signup.id, now).then(reloadSignups, () => undefined);
  }, [event, signup, canEdit, store, reloadSignups]);

  const shown = useMemo(() => regs
    .filter(r => show === "all" || (show === "pending" ? r.status === "pending" : isComing(r)))
    .filter(r => !q || `${r.name} ${r.email || ""} ${r.club || ""} ${r.ticket_title}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.ticket_title.localeCompare(b.ticket_title) || a.name.localeCompare(b.name)), [regs, q, show]);

  const set = (r: EventRegistration, patch: Partial<EventRegistration>, done: string) =>
    run(async () => { await store.update("event_registrations", r.id, patch); await reloadRegs(); }, done);

  const closed = !signup.open || (signup.closes_on || signup.event_date) < todayIso();
  return (
    <Page title={signup.title} intro={<>{longDate(signup.event_date)}{signup.start_time && ` · ${clock(signup.start_time)}`}{signup.location && ` · ${signup.location}`}</>}
      actions={<><button className="ghost" onClick={onBack}>‹ All events</button>{canEdit && <button onClick={() => setSettings(true)}>Sign-up settings</button>}</>}>
      <div className="stats">
        <div className="stat"><span>Coming</span><strong>{totals.people}{signup.capacity ? <small className="muted"> / {signup.capacity}</small> : null}</strong></div>
        <div className="stat"><span>Checked in</span><strong>{totals.checkedIn}</strong></div>
        <div className="stat"><span>Paid on Square</span><strong>{formatMoney(totals.squareCents)}</strong></div>
        <div className="stat"><span>Paid at the door</span><strong>{formatMoney(totals.doorCents)}</strong></div>
        <div className="stat"><span>Waiting on payment</span><strong>{totals.pending}</strong></div>
      </div>

      <section className="card share">
        <div>
          <h2>Sign-up page {closed ? <Pill tone="soon">closed</Pill> : <Pill tone="done">open</Pill>}</h2>
          <p className="muted small">{closed ? "Nobody can sign up right now. Open it again under Sign-up settings." : `Open until ${longDate(signup.closes_on || signup.event_date)}${signup.capacity ? `, up to ${signup.capacity} people` : ""}. The website's Events page shows a Sign up button for this event.`}</p>
          <a className="qr-link" href={url} target="_blank" rel="noopener">{url}</a>
        </div>
        <div className="row-actions">
          <button onClick={() => void run(() => navigator.clipboard.writeText(url), "Link copied")}>Copy link</button>
          <a className="button" href={url} target="_blank" rel="noopener">Open</a>
        </div>
      </section>

      <section className="section" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Tickets</h2></div>
        <p className="muted small">What people can sign up for. A price of 0 makes it free. Leave the cap empty for no limit. Paid tickets are booked under Event entry (fighters) or Admissions (visitors).</p>
        <RecordList table="event_tickets" noun="ticket" rows={tickets} reload={reloadTickets} editable={canEdit}
          defaults={{ signup_id: signup.id, kind: "visitor", price_cents: 0, max_per_order: 1, active: true, sort_order: tickets.length + 1 } as Partial<Tables["event_tickets"]>}
          fields={[
            { key: "title", label: "Ticket name", required: true, wide: true, hint: "Like Fighter registration, Visitor, Volunteer" },
            { key: "kind", label: "What it is", type: "select", options: [...TICKET_KINDS], hint: TICKET_KINDS.map(k => `${k} = ${TICKET_KIND_LABEL[k]}`).join(", ") },
            { key: "price_cents", label: "Price (0 for free)", type: "money", required: true },
            { key: "capacity", label: "Cap, optional", type: "number" },
            { key: "max_per_order", label: "Most per sign-up", type: "number" },
            { key: "sort_order", label: "Order on the page", type: "number" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "active", label: "Offered", type: "checkbox" }
          ]}
          columns={[
            { label: "Ticket", render: t => <>{t.title}{!t.active && <> <Pill>hidden</Pill></>}</> },
            { label: "Price", render: t => (t.price_cents ? <Money cents={t.price_cents} /> : "Free"), className: "num" },
            { label: "Taken", render: t => { const n = regs.filter(r => r.ticket_id === t.id && isComing(r)).reduce((s, r) => s + r.quantity, 0); return t.capacity ? `${n} of ${t.capacity}` : n; }, className: "num" }
          ]} />
      </section>

      <section className="section" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Who's signed up <small className="muted">{totals.byTicket.map(b => `${b.people} ${b.title}`).join(" · ")}</small></h2>
          <div className="row-actions">
            {canEdit && <button className="primary" onClick={() => setWalkUp(true)}>Add at the door</button>}
            <button onClick={() => downloadCsv(`${signup.title.replace(/[^\w]+/g, "-")}-signups.csv`, [
              ["Name", "Ticket", "How many", "Status", "Paid", "Paid by", "Email", "Phone", "Club", "Note", "Checked in", "Signed up"],
              ...regs.map(r => [r.name, r.ticket_title, r.quantity, STATUS_LABEL[r.status], (r.amount_cents / 100).toFixed(2), r.paid_via, r.email, r.phone, r.club, r.note, r.checked_in_at ? r.checked_in_at.slice(0, 16).replace("T", " ") : "", r.created_at.slice(0, 10)])
            ])}>Export CSV</button>
          </div>
        </div>
        <div className="toolbar">
          <input type="search" placeholder="Search names, emails, clubs" value={q} onChange={e => setQ(e.target.value)} aria-label="Search sign-ups" />
          <select value={show} onChange={e => setShow(e.target.value as typeof show)} aria-label="Show">
            <option value="coming">Coming (paid and free)</option>
            <option value="pending">Waiting on payment</option>
            <option value="all">Everyone, including cancelled</option>
          </select>
        </div>
        {shown.length === 0 ? <Empty>{regs.length === 0 ? "Nobody has signed up yet. Share the link above." : "Nobody matches."}</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Ticket</th><th className="num">Paid</th><th>Status</th><th>Contact</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} className={r.checked_in_at ? "checked" : ""}>
                    <td data-label="Name"><strong>{r.name}</strong>{r.club && <small className="muted block">{r.club}</small>}{r.note && <small className="muted block">“{r.note}”</small>}</td>
                    <td data-label="Ticket">{r.quantity > 1 ? `${r.quantity} × ` : ""}{r.ticket_title}</td>
                    <td data-label="Paid" className="num">{r.amount_cents ? <Money cents={r.amount_cents} /> : "Free"}{r.paid_via && r.paid_via !== "square" && <small className="muted block">{r.paid_via === "etransfer" ? "e-Transfer" : r.paid_via}</small>}</td>
                    <td data-label="Status"><Pill tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>{r.checked_in_at && <> <Pill tone="later">checked in</Pill></>}</td>
                    <td data-label="Contact">{r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}{r.phone && <small className="muted block">{r.phone}</small>}</td>
                    <td className="row-actions">
                      {canEdit && isComing(r) && (r.checked_in_at
                        ? <button className="ghost" onClick={() => void set(r, { checked_in_at: null }, "Check-in undone")}>Undo check-in</button>
                        : <button onClick={() => void set(r, { checked_in_at: new Date().toISOString() }, `${r.name} checked in`)}>Check in</button>)}
                      {canEdit && r.status === "pending" && <button className="ghost" onClick={() => void set(r, { status: "paid", paid_via: "cash", paid_at: new Date().toISOString() }, "Marked paid at the door")}>Paid at the door</button>}
                      {canEdit && (r.status === "pending" || r.status === "free" || (r.status === "paid" && r.paid_via !== "square")) &&
                        <button className="ghost" onClick={() => { if (confirm(`Cancel ${r.name}'s sign-up?`)) void set(r, { status: "cancelled", checked_in_at: null }, "Cancelled"); }}>Cancel</button>}
                      {canEdit && r.status === "cancelled" && !r.square_payment_id &&
                        <button className="ghost" onClick={() => void set(r, { status: r.amount_cents ? "pending" : "free" }, "Restored")}>Restore</button>}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
        <p className="muted small">Paid on Square and need to give money back? Refund it in the Square Dashboard; the sign-up shows as Refunded by itself. “Waiting on payment” means they reached Square's page but haven't paid; their spot is held for 45 minutes.</p>
      </section>

      {settings && (
        <Modal title="Sign-up settings" onClose={() => setSettings(false)}>
          <RecordForm
            fields={[
              { key: "open", label: "Taking sign-ups", type: "checkbox" },
              { key: "closes_on", label: "Last day to sign up", type: "date", hint: "Empty = through the event day" },
              { key: "capacity", label: "Most people, all tickets", type: "number", hint: "Empty = no limit" },
              { key: "intro", label: "Message on the sign-up page", type: "textarea" },
              { key: "ask_club", label: "Ask for their club or team", type: "checkbox" },
              { key: "ask_phone", label: "Ask for a phone number (required)", type: "checkbox" }
            ]}
            initial={signup as unknown as Record<string, unknown>}
            onSubmit={async values => {
              if (await run(async () => { await store.update("event_signups", signup.id, values as Partial<EventSignup>); await reloadSignups(); }, "Saved")) setSettings(false);
            }}
            onDelete={regs.length === 0 ? async () => {
              if (!confirm("Stop sign-ups for this event and delete its tickets? Nobody has signed up yet.")) return;
              if (await run(async () => { await store.remove("event_signups", signup.id); await reloadSignups(); }, "Sign-ups removed")) { setSettings(false); onBack(); }
            } : undefined} />
          {regs.length > 0 && <p className="muted small">People have signed up, so these sign-ups can't be deleted. Untick “Taking sign-ups” to close them.</p>}
        </Modal>)}
      {walkUp && <WalkUp signup={signup} tickets={tickets.filter(t => t.active)} onClose={() => setWalkUp(false)} onSaved={reloadRegs} />}
    </Page>
  );
}

/** Someone who signs up at the door: paid in cash or e-Transfer (or free), checked in on the spot. */
function WalkUp({ signup, tickets, onClose, onSaved }: { signup: EventSignup; tickets: EventTicket[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [ticketId, setTicketId] = useState(tickets[0]?.id || "");
  const ticket = tickets.find(t => t.id === ticketId);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [via, setVia] = useState<"cash" | "etransfer" | "other">("cash");
  const [amount, setAmount] = useState("");
  const [checkIn, setCheckIn] = useState(true);
  const total = amount.trim() ? parseMoney(amount) : (ticket?.price_cents || 0) * quantity;
  if (!tickets.length) return <Modal title="Add at the door" onClose={onClose}><Empty>Add a ticket first.</Empty></Modal>;
  return (
    <Modal title="Add at the door" onClose={onClose}>
      <form className="form" onSubmit={async e => {
        e.preventDefault();
        if (!ticket || total === null) return;
        const ok = await run(async () => {
          await store.insert("event_registrations", {
            signup_id: signup.id, ticket_id: ticket.id, ticket_title: ticket.title, kind: ticket.kind, quantity, amount_cents: total, name: name.trim(),
            status: total > 0 ? "paid" : "free", paid_via: total > 0 ? via : null, paid_at: total > 0 ? new Date().toISOString() : null,
            checked_in_at: checkIn ? new Date().toISOString() : null
          });
          await onSaved();
        }, "Added");
        if (ok) onClose();
      }}>
        <div className="grid">
          <label><span>Ticket</span><select value={ticketId} onChange={e => setTicketId(e.target.value)}>{tickets.map(t => <option key={t.id} value={t.id}>{t.title} ({t.price_cents ? formatMoney(t.price_cents) : "free"})</option>)}</select></label>
          <label><span>How many</span><input type="number" min={1} max={20} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></label>
          <label className="wide"><span>Name</span><input value={name} onChange={e => setName(e.target.value)} required /></label>
          {(ticket?.price_cents || 0) > 0 && <>
            <label><span>Paid by</span><select value={via} onChange={e => setVia(e.target.value as typeof via)}><option value="cash">Cash</option><option value="etransfer">e-Transfer</option><option value="other">Other</option></select></label>
            <label><span>Amount</span><input inputMode="decimal" placeholder={((ticket!.price_cents * quantity) / 100).toFixed(2)} value={amount} onChange={e => setAmount(e.target.value)} /><small>Empty = the ticket price</small></label>
          </>}
          <label className="check"><input type="checkbox" checked={checkIn} onChange={e => setCheckIn(e.target.checked)} /> Check them in now</label>
        </div>
        <p className="muted small">Card payments at the table go through the Square card reader instead; they show under Square sales. Cash here isn't added to the ledger; record the cash deposit there as usual.</p>
        <div className="form-actions"><button className="primary">Add {total ? formatMoney(total) : ""}</button></div>
      </form>
    </Modal>
  );
}

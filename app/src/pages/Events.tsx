import { useEffect, useState } from "react";
import { SITE_URL } from "../data/config";
import { isMissingSetup, publicSignups, registrationStatus, startSignup } from "../data/supabase";
import type { PublicSignup, PublicTicket, RegistrationCheck, SignupForm } from "../data/types";
import { Empty, Loading, Money } from "../ui";

// The open event pages (app/#/events and app/#/events/<calendar event id>): anyone signs up for a Reavers event, no account
// needed. Paid tickets finish on Square's checkout; free ones are confirmed straight away.

/** "#/events/abc?done=xyz" → { eventId: "abc", done: "xyz" } */
export function parseEventsHash(hash: string): { eventId: string | null; done: string | null } {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const m = /^\/events\/([^/]+)\/?$/.exec(path);
  return { eventId: m ? decodeURIComponent(m[1]) : null, done: new URLSearchParams(query).get("done") };
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${iso.slice(0, 10)}T12:00:00`));
const clock = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h) ? `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}` : t;
};
const fromPrice = (s: PublicSignup) => {
  const prices = s.tickets.map(t => t.price_cents);
  return prices.length ? Math.min(...prices) : null;
};

export function Events() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const { eventId, done } = parseEventsHash(hash);
  return (
    <div className="public-pay">
      <header className="public-head">
        <a className="brand" href={SITE_URL}><img src={`${import.meta.env.BASE_URL}crest.png`} alt="" width="40" height="40" /> Red Deer Reavers</a>
        <nav className="public-nav"><a href="#/events">Events</a><a href="#/buy">Pay the Reavers</a></nav>
      </header>
      {eventId ? <EventPage key={`${eventId}|${done}`} eventId={eventId} done={done} /> : <EventList />}
    </div>
  );
}

function useSignups(eventId?: string) {
  const [list, setList] = useState<PublicSignup[] | null>(null);
  const [problem, setProblem] = useState("");
  useEffect(() => {
    publicSignups(eventId).then(setList, e => {
      setList([]);
      setProblem(isMissingSetup(e) ? "Online sign-ups aren't switched on yet. Message the Reavers to sign up." : "Couldn't load the events. Try again in a minute.");
    });
  }, [eventId]);
  return { list, problem };
}

function EventList() {
  const { list, problem } = useSignups();
  useEffect(() => { document.title = "Sign up for a Reavers event"; }, []);
  return (
    <section className="page">
      <header className="page-head"><div>
        <h1>Sign up for an event</h1>
        <p className="intro">Register to fight, grab visitor tickets, or volunteer at a Red Deer Reavers event. Paid tickets go through Square: card, Apple Pay or Google Pay.</p>
      </div></header>
      {problem && <p className="banner">{problem}</p>}
      {!list ? <Loading /> : list.length === 0 ? <Empty>No events are taking sign-ups right now. See the <a href={`${SITE_URL}events.html`}>events calendar</a>.</Empty> : (
        <div className="cards">
          {list.map(s => {
            const from = fromPrice(s);
            return (
              <a key={s.id} className="card event-tile" href={`#/events/${encodeURIComponent(s.event_id)}`}>
                <p className="kicker">{longDate(s.event_date)}</p>
                <h2>{s.title}</h2>
                {s.location && <p className="muted">{s.location}{s.start_time && ` · ${clock(s.start_time)}`}</p>}
                <p>{from === null ? "" : from === 0 ? "Free to sign up" : <>From <Money cents={from} /></>}{s.spots_left !== null && <span className="muted"> · {s.spots_left} spots left</span>}</p>
                <span className="button primary">Sign up</span>
              </a>);
          })}
        </div>)}
    </section>
  );
}

function EventPage({ eventId, done }: { eventId: string; done: string | null }) {
  const { list, problem } = useSignups(eventId);
  const [pick, setPick] = useState<string | null>(null);
  const s = list?.[0];
  useEffect(() => { document.title = s ? `${s.title} · sign up` : "Sign up"; }, [s]);
  if (!list) return <Loading />;
  if (!s) return (
    <section className="page">
      {problem ? <p className="banner">{problem}</p> : <Empty>This event isn't taking sign-ups. See <a href="#/events">events open for sign-up</a> or the <a href={`${SITE_URL}events.html`}>calendar</a>.</Empty>}
    </section>);
  const soldOut = s.spots_left === 0;
  return (
    <section className="page">
      <header className="page-head event-head"><div>
        <p className="kicker">{longDate(s.event_date)}{s.start_time && ` · ${clock(s.start_time)}`}</p>
        <h1>{s.title}</h1>
        {s.location && <p className="intro">{s.location}</p>}
      </div></header>
      {done && <DoneBanner id={done} />}
      {s.intro && <p className="event-intro">{s.intro}</p>}
      {!s.open ? <p className="banner">Sign-ups for this event are closed.</p>
        : soldOut ? <p className="banner">This event is full.</p>
        : <p className="muted small">Sign up by {longDate(s.closes_on)}.{s.spots_left !== null && ` ${s.spots_left} spots left.`}</p>}
      {s.open && !soldOut && (s.tickets.length === 0 ? <Empty>Tickets aren't posted yet. Check back soon.</Empty> : (
        <div className="cards">
          {s.tickets.map(t => {
            const out = t.spots_left === 0;
            return (
              <article key={t.id} className={pick === t.id ? "card buy open" : "card buy"}>
                <p className="kicker">{t.kind === "tournament" ? "Fighters" : t.kind === "visitor" ? "Visitors" : "Sign up"}</p>
                <h2>{t.title}</h2>
                {t.description && <p className="muted">{t.description}</p>}
                <p className="big">{t.price_cents === 0 ? "Free" : <><Money cents={t.price_cents} />{t.max_per_order > 1 && <small className="muted"> each</small>}</>}</p>
                {t.spots_left !== null && <p className="muted small">{out ? "Sold out" : `${t.spots_left} left`}</p>}
                {pick === t.id
                  ? <SignupFormView signup={s} ticket={t} onCancel={() => setPick(null)} />
                  : <button className="primary" disabled={out} onClick={() => setPick(t.id)}>{out ? "Sold out" : t.kind === "tournament" ? "Register" : t.price_cents === 0 ? "Sign up" : "Get tickets"}</button>}
              </article>);
          })}
        </div>))}
      <p className="muted small" style={{ marginTop: 18 }}><a href={`${SITE_URL}events.html`}>All Reavers events</a></p>
    </section>
  );
}

/** After Square sends the buyer back: confirms the sign-up, waiting a little for Square's webhook if it is slow. */
function DoneBanner({ id }: { id: string }) {
  const [check, setCheck] = useState<RegistrationCheck | null | undefined>(undefined);
  useEffect(() => {
    let tries = 0;
    let stop = false;
    const look = async () => {
      const r = await registrationStatus(id).catch(() => null);
      if (stop) return;
      setCheck(r);
      if (r?.status === "pending" && ++tries < 10) setTimeout(look, 3000);
    };
    void look();
    return () => { stop = true; };
  }, [id]);
  if (check === undefined) return <p className="banner good">Checking your sign-up…</p>;
  if (!check) return <p className="banner">We couldn't find that sign-up. If you paid, Square has emailed your receipt; show it at the door.</p>;
  const what = `${check.quantity > 1 ? `${check.quantity} × ` : ""}${check.ticket}`;
  if (check.status === "paid" || check.status === "free")
    return <p className="banner good">You're signed up{check.first_name ? `, ${check.first_name}` : ""}! {what} for {check.title}.{check.status === "paid" ? " Square has emailed your receipt." : ""} See you there.</p>;
  if (check.status === "pending")
    return <p className="banner">Square is still confirming your payment for {what}. This page updates by itself; if you closed Square's page before paying, pick your ticket again below.</p>;
  return <p className="banner">This sign-up was {check.status}. Questions? Message the Reavers.</p>;
}

function SignupFormView({ signup, ticket, onCancel }: { signup: PublicSignup; ticket: PublicTicket; onCancel: () => void }) {
  const [form, setForm] = useState({ quantity: 1, name: "", email: "", phone: "", club: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const most = Math.min(ticket.max_per_order, ticket.spots_left ?? 99, signup.spots_left ?? 99);
  const paid = ticket.price_cents > 0;
  return (
    <form className="form" onSubmit={async e => {
      e.preventDefault();
      setBusy(true);
      setError("");
      const req: SignupForm = {
        ticket_id: ticket.id, quantity: form.quantity, name: form.name, email: form.email,
        phone: form.phone || null, club: form.club || null, note: form.note || null,
        return_url: `${window.location.href.split("#")[0]}#/events/${encodeURIComponent(signup.event_id)}`
      };
      try {
        const out = await startSignup(req);
        window.location.assign(out.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setBusy(false);
      }
    }}>
      {most > 1 && (
        <label><span>How many</span>
          <select value={form.quantity} onChange={e => set("quantity", Number(e.target.value))}>
            {Array.from({ length: most }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>)}
      <label><span>{ticket.kind === "tournament" ? "Fighter's name" : "Your name"}</span><input value={form.name} onChange={e => set("name", e.target.value)} autoComplete="name" required /></label>
      <label><span>{paid ? "Email for the receipt" : "Email (optional)"}</span><input type="email" value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" required={paid} /></label>
      {signup.ask_phone && <label><span>Phone</span><input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="tel" required /></label>}
      {signup.ask_club && <label><span>Club or team (optional)</span><input value={form.club} onChange={e => set("club", e.target.value)} /></label>}
      <label><span>Anything we should know? (optional)</span><textarea rows={2} value={form.note} onChange={e => set("note", e.target.value)} maxLength={1000} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button className="primary" disabled={busy}>{busy ? (paid ? "Opening Square…" : "Saving…") : paid ? <>Pay <Money cents={ticket.price_cents * form.quantity} /></> : "Sign up"}</button>
      </div>
      {paid && <p className="muted small">You'll finish on Square's secure page: card, Apple Pay or Google Pay.</p>}
    </form>
  );
}

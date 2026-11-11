import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EVENT_TYPES, type BosEvent, type SiteEvent } from "../../data/website";
import { Empty, Modal, Page, Pill, RecordForm, todayIso, useStore } from "../../ui";
import { CaptainOnly, clock, hhmm, longDate, useSite } from "./shared";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function Calendar() {
  const store = useStore();
  const navigate = useNavigate();
  const { data, failed, act } = useSite();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [bos, setBos] = useState<BosEvent[] | null | undefined>(undefined);
  const [editing, setEditing] = useState<Partial<SiteEvent> | null>(null);
  useEffect(() => { store.website.bosEvents().then(setBos, () => setBos(null)); }, [store]);
  const today = todayIso();

  const days = useMemo(() => {
    const start = new Date(month); start.setDate(1 - month.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const shift = (by: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + by, 1));

  return (
    <Page title="Calendar" intro="The website's events and weekly practices, with every BuhurtOS event alongside. Tap a date to add an event that day."
      actions={data?.admin && <button className="primary" onClick={() => setEditing({ event_date: today })}>Add event</button>}>
      <CaptainOnly data={data} failed={failed}>{d => {
        const practices = d.practices.filter(p => p.active);
        const events = [...d.events].sort((a, b) => a.event_date.localeCompare(b.event_date) || String(a.start_time || "").localeCompare(String(b.start_time || "")));
        const upcomingBos = (bos || []).filter(e => !e.past);
        const pastBos = (bos || []).length - upcomingBos.length;
        return (<>
          <div className="cal-bar">
            <button onClick={() => shift(-1)} aria-label="Previous month">‹</button>
            <strong>{new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(month)}</strong>
            <button onClick={() => shift(1)} aria-label="Next month">›</button>
            <button className="ghost" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }}>Today</button>
          </div>
          <div className="cal" role="grid" aria-label="Month">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => <div key={w} className="cal-head" aria-hidden>{w}</div>)}
            {days.map(day => {
              const key = iso(day);
              const cls = ["cal-day", day.getMonth() !== month.getMonth() && "outside", key === today && "today"].filter(Boolean).join(" ");
              return (
                <div key={key} className={cls} onClick={e => { if (!(e.target as HTMLElement).closest(".cal-item")) setEditing({ event_date: key }); }}>
                  <button className="cal-date" aria-label={`Add an event on ${longDate(key)}`}>{day.getDate()}</button>
                  {practices.filter(p => Number(p.weekday) === day.getDay()).map(p =>
                    <button key={p.id} className="cal-item practice" title={`${p.label} practice, ${clock(p.start_time)}`} onClick={() => navigate("/practices")}>{p.label} practice</button>)}
                  {events.filter(e => e.event_date === key).map(e =>
                    <button key={e.id} className={`cal-item ${e.event_type || "other"}${e.is_public ? "" : " private"}`} title={e.title} onClick={() => setEditing(e)}>{e.title}</button>)}
                  {(bos || []).filter(e => key >= e.startsOn && key <= (e.endsOn || e.startsOn)).map(e =>
                    <a key={e.id} className={`cal-item bos${e.reavers ? " reavers" : ""}`} href={e.url} target="_blank" rel="noopener" title={`${e.name} (on BuhurtOS${e.reavers ? `, Reavers ${e.reavers}` : ""})`}>{e.name}</a>)}
                </div>);
            })}
          </div>
          <p className="cal-key muted small"><span className="cal-swatch practice" /> Practice <span className="cal-swatch tournament" /> Tournament <span className="cal-swatch demo" /> Demo <span className="cal-swatch meeting" /> Meeting <span className="cal-swatch social" /> Social <span className="cal-swatch bos" /> On BuhurtOS</p>

          <div className="cards two">
            <section className="card">
              <h2>Website events <small className="muted">{events.length} saved</small></h2>
              {events.length === 0 ? <Empty>No events yet. Add a tournament, demo, meeting, social or one-off practice.</Empty> : (
                <ul className="rows">
                  {events.map(e => (
                    <li key={e.id} className={e.event_date < today ? "dim" : ""}>
                      <div>
                        <strong>{e.title}</strong>
                        <small className="muted block">{longDate(e.event_date)}{e.start_time && ` · ${clock(e.start_time)}`}{e.location && ` · ${e.location}`}</small>
                        <span className="tags"><Pill>{e.event_type || "other"}</Pill> {e.is_public ? <Pill tone="done">public</Pill> : <Pill tone="soon">hidden</Pill>}</span>
                      </div>
                      <div className="row-actions">
                        <button className="ghost" onClick={() => setEditing(e)}>Edit</button>
                        <button className="ghost" onClick={() => { if (confirm(`Delete “${e.title}”? This cannot be undone.`)) void act({ action: "event_delete", id: e.id }, "Deleted"); }}>Delete</button>
                      </div>
                    </li>))}
                </ul>)}
            </section>
            <section className="card">
              <h2>Events on BuhurtOS</h2>
              <p className="muted small">Every BuhurtOS event shows on the public Events page by itself, and the ones the Reavers host or enter are labelled. Nothing to add here.</p>
              {bos === undefined ? <p className="muted">Loading events from BuhurtOS…</p> : bos === null ? <p className="muted">BuhurtOS could not be reached just now.</p> : (
                <ul className="rows">
                  {upcomingBos.length === 0 && <li className="muted">No upcoming events on BuhurtOS yet.</li>}
                  {upcomingBos.map(e => (
                    <li key={e.id}>
                      <div>
                        <strong>{e.name}</strong>
                        <small className="muted block">{e.reavers && `Reavers ${e.reavers} · `}{longDate(e.startsOn)}{e.endsOn && e.endsOn !== e.startsOn && ` to ${longDate(e.endsOn)}`}{e.where && ` · ${e.where}`}</small>
                      </div>
                      <a className="button ghost" href={e.url} target="_blank" rel="noopener">Open</a>
                    </li>))}
                  {pastBos > 0 && <li className="muted small">Plus {pastBos} finished event{pastBos === 1 ? "" : "s"}, listed under “Past events” on the website.</li>}
                </ul>)}
            </section>
          </div>
        </>);
      }}</CaptainOnly>
      {editing && <EventEditor event={editing} onClose={() => setEditing(null)} act={act} />}
    </Page>
  );
}

function EventEditor({ event, onClose, act }: { event: Partial<SiteEvent>; onClose: () => void; act: ReturnType<typeof useSite>["act"] }) {
  const id = event.id;
  return (
    <Modal title={id ? "Edit event" : "Add event"} onClose={onClose}>
      {id && event.is_public && <p className="muted small">Taking registrations or selling tickets for this? Set it up under <a href="#/signups" onClick={onClose}>Event sign-ups</a>.</p>}
      <RecordForm
        fields={[
          { key: "title", label: "Event title", required: true, wide: true },
          { key: "event_type", label: "Type", type: "select", options: [...EVENT_TYPES] },
          { key: "event_date", label: "Date", type: "date", required: true },
          { key: "start_time", label: "Start time", type: "time" },
          { key: "end_time", label: "End time", type: "time" },
          { key: "location", label: "Location", wide: true },
          { key: "details", label: "Details", type: "textarea" },
          { key: "href", label: "Link, optional", type: "url", wide: true },
          { key: "is_public", label: "Show on the public website", type: "checkbox" }
        ]}
        initial={{ event_type: "other", is_public: true, ...event, start_time: hhmm(event.start_time), end_time: hhmm(event.end_time) }}
        onSubmit={async values => { if (await act({ action: "event_save", item: { ...values, id } as Partial<SiteEvent> }, "Saved")) onClose(); }}
        onDelete={id ? async () => { if (confirm("Delete this event? This cannot be undone.") && await act({ action: "event_delete", id }, "Deleted")) onClose(); } : undefined}
      />
    </Modal>
  );
}

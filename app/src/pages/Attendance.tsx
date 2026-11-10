import { useCallback, useEffect, useMemo, useState } from "react";
import { GATHERING_KINDS, type Gathering, type GatheringKind, type Person } from "../data/attendance";
import { DEFAULT_TIMER_DAYS, NO_SHOW_MONTHS, TIMER_CHOICES, absentSince, ago, isNoShow, recentRate, timerState } from "../lib/attendance";
import { Empty, Loading, Modal, Page, Pill, dateLabel, errorText, todayIso, useAction, useStore, useToast } from "../ui";

const KIND_LABEL: Record<GatheringKind, string> = { practice: "Practice", tournament: "Tournament", event: "Event", fundraiser: "Fundraiser" };
const STATUS_LABEL: Record<Person["status"], string> = { active: "Active", away: "Away", removal: "Removal timer", removed: "Removed" };

/** Loads people and gatherings together, since every number on the page needs both. */
function useAttendance() {
  const store = useStore();
  const toast = useToast();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [gatherings, setGatherings] = useState<Gathering[] | null>(null);
  const reload = useCallback(async () => {
    try {
      const [p, g] = await Promise.all([store.attendance.people(), store.attendance.gatherings()]);
      setPeople(p); setGatherings(g);
    } catch (e) { toast(errorText(e), true); setPeople([]); setGatherings([]); }
  }, [store, toast]);
  useEffect(() => { void reload(); }, [reload]);
  return { people, gatherings, reload };
}

export function Attendance() {
  const { people, gatherings, reload } = useAttendance();
  const [tab, setTab] = useState<"members" | "gatherings">("members");
  return (
    <Page title="Attendance"
      intro={<>Who comes to practices, tournaments, events and fundraisers. Anyone not seen for {NO_SHOW_MONTHS} months is flagged here and posted to the leadership channel on Discord. A captain or executive can then start a removal timer, and the bot asks them why.</>}>
      <div className="segmented" role="tablist" aria-label="Attendance views">
        <button role="tab" aria-selected={tab === "members"} onClick={() => setTab("members")}>Members</button>
        <button role="tab" aria-selected={tab === "gatherings"} onClick={() => setTab("gatherings")}>Take attendance</button>
      </div>
      {!people || !gatherings ? <Loading />
        : tab === "members" ? <Members people={people} gatherings={gatherings} reload={reload} />
          : <Gatherings people={people} gatherings={gatherings} reload={reload} />}
    </Page>
  );
}

// ------------------------------------------------------------------ members

function Members({ people, gatherings, reload }: { people: Person[]; gatherings: Gathering[]; reload: () => Promise<void> }) {
  const today = todayIso();
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"current" | "all" | "removed">("current");
  const [open, setOpen] = useState<Person | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const dates = useMemo(() => gatherings.map(g => g.date), [gatherings]);
  const facts = (p: Person) => ({ ...p, last_seen: p.stats.last_seen });
  const noShows = people.filter(p => isNoShow(facts(p), today));
  const timers = people.filter(p => p.status === "removal");
  const shown = people
    .filter(p => show === "all" || (show === "removed" ? p.status === "removed" : p.status !== "removed"))
    .filter(p => !q || `${p.name} ${p.discord_name || ""}`.toLowerCase().includes(q.toLowerCase()));
  const current = open && open !== "new" ? people.find(p => p.id === open.id) || null : null;

  return (
    <>
      {(noShows.length > 0 || timers.length > 0) && (
        <div className="cards att-alerts">
          {noShows.length > 0 && (
            <article className="card alert-card">
              <h2>{noShows.length} {noShows.length === 1 ? "member hasn't" : "members haven't"} shown up in {NO_SHOW_MONTHS}+ months</h2>
              <ul className="list">
                {noShows.map(p => (
                  <li key={p.id}>
                    <button className="link" onClick={() => setOpen(p)}>{p.name}</button>
                    <span className="muted small">{p.stats.last_seen ? `last seen ${ago(p.stats.last_seen, today)}` : "never marked present"}</span>
                  </li>))}
              </ul>
              <p className="muted small">Open someone to log that you heard from them, mark them away, or start a removal timer.</p>
            </article>)}
          {timers.length > 0 && (
            <article className="card">
              <h2>Removal timers running</h2>
              <ul className="list">
                {timers.map(p => {
                  const t = timerState(p, today);
                  return (
                    <li key={p.id}>
                      <button className="link" onClick={() => setOpen(p)}>{p.name}{p.reply_text && " · replied"}</button>
                      <Pill tone={t.running && t.expired ? "overdue" : "soon"}>{t.running && t.expired ? "Time's up" : t.running ? `${t.daysLeft} days left` : ""}</Pill>
                    </li>);
                })}
              </ul>
            </article>)}
        </div>)}

      <div className="toolbar">
        <input type="search" placeholder="Search members" value={q} onChange={e => setQ(e.target.value)} aria-label="Search members" />
        <select value={show} onChange={e => setShow(e.target.value as typeof show)} aria-label="Show">
          <option value="current">Current members</option>
          <option value="removed">Removed</option>
          <option value="all">Everyone</option>
        </select>
        <button onClick={() => setImporting(true)}>Add from roster</button>
        <button className="primary" onClick={() => setOpen("new")}>Add member</button>
      </div>

      {shown.length === 0 ? <Empty>{people.length ? "Nobody matches." : "No members in the tracker yet. Add them from the BuhurtOS roster to start taking attendance."}</Empty> : (
        <div className="table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>Member</th><th>Started</th><th>Last practice</th><th>Last seen</th><th>Last heard from</th>
                <th>Last {NO_SHOW_MONTHS} months</th><th className="num" title="Practices · tournaments · events · fundraisers">All time</th><th>Status</th><th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(p => {
                const rate = recentRate(p.stats.recent, dates, p.started_on, today);
                const flagged = isNoShow(facts(p), today);
                const t = timerState(p, today);
                return (
                  <tr key={p.id} className={flagged ? "flagged" : undefined}>
                    <td data-label="Member"><strong>{p.name}</strong>{p.discord_name && <small className="muted block">@{p.discord_name}</small>}</td>
                    <td data-label="Started">{p.started_on ? dateLabel(p.started_on) : <span className="muted">-</span>}</td>
                    <td data-label="Last practice">{p.stats.last_practice ? dateLabel(p.stats.last_practice) : <span className="muted">never</span>}</td>
                    <td data-label="Last seen">{flagged ? <Pill tone="overdue">{ago(absentSince(facts(p)), today)}</Pill> : ago(p.stats.last_seen, today)}</td>
                    <td data-label="Last heard from">{p.last_contact_on ? <>{ago(p.last_contact_on, today)}{p.last_contact_note && <small className="muted block">{p.last_contact_note}</small>}</> : <span className="muted">-</span>}</td>
                    <td data-label={`Last ${NO_SHOW_MONTHS} months`}>
                      {rate.percent === null ? <span className="muted">nothing held</span> : (
                        <div className="rate"><div className="bar"><span style={{ width: `${rate.percent}%` }} className={rate.percent < 25 ? "over" : undefined} /></div><small>{rate.attended} of {rate.held} · {rate.percent}%</small></div>)}
                    </td>
                    <td data-label="All time" className="num" title={`${p.stats.practices} practices, ${p.stats.tournaments} tournaments, ${p.stats.events} events, ${p.stats.fundraisers} fundraisers`}>
                      {p.stats.practices} · {p.stats.tournaments} · {p.stats.events} · {p.stats.fundraisers}
                    </td>
                    <td data-label="Status">
                      <Pill tone={p.status === "removal" ? (t.running && t.expired ? "overdue" : "soon") : p.status === "removed" ? "overdue" : p.status === "away" ? "later" : flagged ? "overdue" : "done"}>
                        {p.status === "removal" && t.running ? (t.expired ? "Time's up" : `Timer: ${t.daysLeft}d`) : flagged ? "No-show" : STATUS_LABEL[p.status]}
                      </Pill>
                    </td>
                    <td className="row-actions"><button className="ghost" onClick={() => setOpen(p)}>Open</button></td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>)}
      <p className="muted small">All time counts practices · tournaments · events · fundraisers. "Last {NO_SHOW_MONTHS} months" is how many of the club's gatherings they came to since they started or in the last {NO_SHOW_MONTHS} months, whichever is shorter.</p>

      {open === "new" && <PersonForm person={null} onClose={() => setOpen(null)} reload={reload} />}
      {current && <PersonSheet person={current} gatherings={gatherings} onClose={() => setOpen(null)} reload={reload} />}
      {importing && <ImportRoster people={people} onClose={() => setImporting(false)} reload={reload} />}
    </>
  );
}

function PersonForm({ person, onClose, reload }: { person: Person | null; onClose: () => void; reload: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [v, setV] = useState({
    name: person?.name || "", started_on: person?.started_on || todayIso(), discord_name: person?.discord_name || "",
    discord_id: person?.discord_id || "", notes: person?.notes || ""
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <Modal title={person ? `Edit ${person.name}` : "Add member"} onClose={onClose}>
      <form className="form" onSubmit={async e => {
        e.preventDefault();
        const details = { name: v.name.trim(), started_on: v.started_on || null, discord_name: v.discord_name.trim().replace(/^@/, "") || null, discord_id: v.discord_id.trim() || null, notes: v.notes.trim() || null };
        if (await run(() => store.attendance.savePerson(person?.id || null, details), "Saved")) { onClose(); await reload(); }
      }}>
        <div className="grid">
          <label className="wide"><span>Name *</span><input required value={v.name} onChange={set("name")} /></label>
          <label><span>Started with the club</span><input type="date" value={v.started_on} onChange={set("started_on")} /></label>
          <label><span>Discord username</span><input value={v.discord_name} onChange={set("discord_name")} placeholder="e.g. jordan.swings" /></label>
          <label className="wide"><span>Discord user ID</span><input inputMode="numeric" pattern="[0-9]{15,22}" value={v.discord_id} onChange={set("discord_id")} />
            <small>Only needed if they don't sign in to BuhurtOS with Discord. In Discord: Settings → Advanced → Developer Mode, then right-click them → Copy User ID.</small></label>
          <label className="wide"><span>Notes</span><textarea rows={3} value={v.notes} onChange={set("notes")} /></label>
        </div>
        <div className="form-actions">
          {person && <button type="button" className="danger" onClick={async () => {
            if (!confirm(`Delete ${person.name} and their attendance history from the tracker? This doesn't touch BuhurtOS or Discord.`)) return;
            if (await run(() => store.attendance.removePerson(person.id), "Deleted")) { onClose(); await reload(); }
          }}>Delete</button>}
          <button className="primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function PersonSheet({ person: p, gatherings, onClose, reload }: { person: Person; gatherings: Gathering[]; onClose: () => void; reload: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const toast = useToast();
  const today = todayIso();
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<number>(DEFAULT_TIMER_DAYS);
  const [note, setNote] = useState("");
  const [heard, setHeard] = useState("");
  const [busy, setBusy] = useState(false);
  const flagged = isNoShow({ ...p, last_seen: p.stats.last_seen }, today);
  const t = timerState(p, today);
  const act = async (fn: () => Promise<unknown>, done: string) => { setBusy(true); const ok = await run(fn, done); setBusy(false); if (ok) await reload(); return ok; };
  const ask = async () => {
    setBusy(true);
    try { toast(await store.attendance.askOnDiscord(p.id)); } catch (e) { toast(errorText(e), true); }
    setBusy(false);
    await reload();
  };
  if (editing) return <PersonForm person={p} onClose={() => setEditing(false)} reload={reload} />;
  return (
    <Modal title={p.name} onClose={onClose}>
      <div className="stats att-stats">
        <div className="stat"><span>Practices</span><strong>{p.stats.practices}</strong></div>
        <div className="stat"><span>Tournaments</span><strong>{p.stats.tournaments}</strong></div>
        <div className="stat"><span>Events</span><strong>{p.stats.events}</strong></div>
        <div className="stat"><span>Fundraisers</span><strong>{p.stats.fundraisers}</strong></div>
      </div>
      <dl className="facts">
        <dt>Started</dt><dd>{p.started_on ? dateLabel(p.started_on) : "not set"}{p.stats.first_seen && ` · first marked present ${dateLabel(p.stats.first_seen)}`}</dd>
        <dt>Last practice</dt><dd>{p.stats.last_practice ? `${dateLabel(p.stats.last_practice)} (${ago(p.stats.last_practice, today)})` : "never"}</dd>
        <dt>Last seen</dt><dd>{p.stats.last_seen ? `${dateLabel(p.stats.last_seen)} (${ago(p.stats.last_seen, today)})` : "never"} {flagged && <Pill tone="overdue">No-show</Pill>}</dd>
        <dt>Last heard from</dt><dd>{p.last_contact_on ? `${dateLabel(p.last_contact_on)}${p.last_contact_note ? `: ${p.last_contact_note}` : ""}` : "nobody has logged it"}</dd>
        <dt>Discord</dt><dd>{p.discord_name ? `@${p.discord_name}` : p.discord_id ? `ID ${p.discord_id}` : p.user_id || p.membership_id || p.fighter_id ? "from their BuhurtOS sign-in" : <span className="muted">not linked</span>}</dd>
        {p.notes && <><dt>Notes</dt><dd className="pre">{p.notes}</dd></>}
      </dl>

      <form className="inline-form" onSubmit={async e => {
        e.preventDefault();
        if (await act(() => store.attendance.savePerson(p.id, { last_contact_on: today, last_contact_note: heard.trim() || null }), "Logged")) setHeard("");
      }}>
        <input placeholder="Heard from them today? e.g. Texted, back next month" value={heard} onChange={e => setHeard(e.target.value)} aria-label="What they said" />
        <button disabled={busy}>Log contact</button>
      </form>

      {p.status === "removal" && t.running && (
        <section className={t.expired ? "timer expired" : "timer"}>
          <h3>{t.expired ? "The removal timer has run out" : `Removal timer: ${t.daysLeft} days left`}</h3>
          <p className="muted small">Started {dateLabel(p.removal_started_at)}, runs until {dateLabel(p.removal_deadline)}.{p.removal_note && ` Reason: ${p.removal_note}`}</p>
          <p>{p.dm_sent_at ? `The bot messaged them on Discord ${ago(p.dm_sent_at.slice(0, 10), today)}.` : p.dm_error ? <span className="error">Discord message failed: {p.dm_error}</span> : "The bot hasn't messaged them yet."}</p>
          {p.reply_text
            ? <blockquote className="reply"><strong>Their answer ({dateLabel(p.reply_at)}):</strong> {p.reply_text}</blockquote>
            : <p className="muted">No answer yet.</p>}
          <div className="form-actions">
            <button disabled={busy} onClick={ask}>{p.dm_sent_at ? "Ask again on Discord" : "Ask on Discord"}</button>
            <button disabled={busy} onClick={() => { const why = prompt(`Keep ${p.name} on the team? Add a note for the record (optional).`, p.reply_text ? "Replied with a good reason" : ""); if (why !== null) void act(() => store.attendance.stopRemoval(p.id, why), "Timer stopped"); }}>Stop timer, keep them</button>
            <button className="danger" disabled={busy || !t.expired} title={t.expired ? undefined : "Available once the timer runs out"}
              onClick={() => { if (confirm(`Mark ${p.name} as removed? Remember to take them off the BuhurtOS roster and the Discord server yourself.`)) void act(() => store.attendance.markRemoved(p.id), "Marked removed"); }}>Mark removed</button>
          </div>
        </section>)}

      {(p.status === "active" || p.status === "away") && (
        <section className="timer start">
          <h3>Start the removal timer</h3>
          <p className="muted small">The bot messages them on Discord and asks why they haven't been around. If nothing changes by the deadline, you can mark them removed.</p>
          <div className="inline-form">
            <select value={days} onChange={e => setDays(Number(e.target.value))} aria-label="How long they have">
              {TIMER_CHOICES.map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
            <input placeholder="Reason, for the record (e.g. No practice since spring)" value={note} onChange={e => setNote(e.target.value)} aria-label="Reason" />
            <button className={flagged ? "primary" : undefined} disabled={busy} onClick={async () => {
              if (!confirm(`Start a ${days}-day removal timer for ${p.name}? The bot will message them on Discord.`)) return;
              if (await act(() => store.attendance.startRemoval(p.id, days, note), "Timer started")) { setNote(""); await ask(); }
            }}>Start timer</button>
          </div>
        </section>)}

      {p.status === "removed" && (
        <section className="timer">
          <h3>Removed {dateLabel(p.removed_on)}</h3>
          {p.reply_text && <blockquote className="reply"><strong>Their answer:</strong> {p.reply_text}</blockquote>}
          <div className="form-actions"><button disabled={busy} onClick={() => act(() => store.attendance.stopRemoval(p.id, "Back on the team"), "Welcome back")}>Bring them back</button></div>
        </section>)}

      <div className="form-actions">
        {(p.status === "active" || p.status === "away") && (
          <button className="ghost" disabled={busy} onClick={() => act(() => store.attendance.setAway(p.id, p.status === "active"), p.status === "active" ? "Marked away" : "Marked active")}>
            {p.status === "active" ? "Mark away (injury, travel…)" : "Back from away"}
          </button>)}
        <button className="ghost" onClick={() => setEditing(true)}>Edit details</button>
      </div>
      <RecentFor person={p} gatherings={gatherings} />
    </Modal>
  );
}

/** The last few gatherings and whether this person was there. */
function RecentFor({ person, gatherings }: { person: Person; gatherings: Gathering[] }) {
  const store = useStore();
  const today = todayIso();
  const recent = useMemo(() => gatherings.filter(g => g.date <= today).slice(0, 8), [gatherings, today]);
  const [present, setPresent] = useState<Set<string> | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all(recent.map(async g => ((await store.attendance.present(g.id)).includes(person.id) ? g.id : null)))
      .then(ids => { if (live) setPresent(new Set(ids.filter((x): x is string => Boolean(x)))); })
      .catch(() => { if (live) setPresent(new Set()); });
    return () => { live = false; };
  }, [recent, person.id, store]);
  if (!recent.length) return null;
  return (
    <details className="manage">
      <summary>Last {recent.length} gatherings</summary>
      {!present ? <Loading /> : (
        <ul className="list">
          {recent.map(g => <li key={g.id}><span>{dateLabel(g.date)} · {g.title || KIND_LABEL[g.kind]}</span>{present.has(g.id) ? <Pill tone="done">Present</Pill> : <Pill>Absent</Pill>}</li>)}
        </ul>)}
    </details>
  );
}

function ImportRoster({ people, onClose, reload }: { people: Person[]; onClose: () => void; reload: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  type Candidate = { key: string; name: string; fighter_id: string | null; membership_id: string | null; source: string };
  const [list, setList] = useState<Candidate[] | null>(null);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    (async () => {
      const [fighters, members] = await Promise.all([store.website.fighters().catch(() => []), store.website.clubMembers().catch(() => ({ ok: false as const, reason: "" }))]);
      const have = new Set(people.flatMap(p => [p.fighter_id, p.membership_id, p.name.trim().toLowerCase()]).filter(Boolean));
      const out = new Map<string, Candidate>();
      if (members.ok) for (const m of members.members) if (m.status !== "withdrawn") out.set(m.full_name.trim().toLowerCase(), { key: m.membership_id, name: m.full_name, membership_id: m.membership_id, fighter_id: m.fighter_id, source: `Club member${m.office ? ` · ${m.office}` : ""}` });
      for (const f of fighters) {
        const k = f.name.trim().toLowerCase();
        const existing = [...out.values()].find(c => c.fighter_id === f.id);
        if (existing) continue;
        if (out.has(k)) out.get(k)!.fighter_id = f.id;
        else out.set(k, { key: f.id, name: f.name, fighter_id: f.id, membership_id: null, source: f.captain ? "BuhurtOS fighter · captain" : "BuhurtOS fighter" });
      }
      const fresh = [...out.values()].filter(c => !have.has(c.name.trim().toLowerCase()) && !(c.fighter_id && have.has(c.fighter_id)) && !(c.membership_id && have.has(c.membership_id)));
      setList(fresh.sort((a, b) => a.name.localeCompare(b.name)));
      setPicked(new Set(fresh.map(c => c.key)));
      if (!members.ok && members.reason) setNote(members.reason);
    })();
  }, [store, people]);
  return (
    <Modal title="Add from the roster" onClose={onClose}>
      <p className="muted">Club members and BuhurtOS fighters who aren't in the tracker yet. Their start date is set to today; change it on each person if you know it.</p>
      {note && <p className="muted small">{note}</p>}
      {!list ? <Loading /> : list.length === 0 ? <Empty>Everyone on the roster is already in the tracker.</Empty> : (
        <ul className="checklist">
          {list.map(c => (
            <li key={c.key}><label><input type="checkbox" checked={picked.has(c.key)} onChange={e => setPicked(s => { const n = new Set(s); if (e.target.checked) n.add(c.key); else n.delete(c.key); return n; })} /> {c.name}</label><small className="muted">{c.source}</small></li>))}
        </ul>)}
      <div className="form-actions">
        <button className="primary" disabled={!list || picked.size === 0} onClick={async () => {
          const chosen = (list || []).filter(c => picked.has(c.key));
          if (await run(async () => { for (const c of chosen) await store.attendance.savePerson(null, { name: c.name, fighter_id: c.fighter_id, membership_id: c.membership_id, started_on: todayIso() }); }, `Added ${chosen.length}`)) { onClose(); await reload(); }
        }}>Add {picked.size || ""}</button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ taking attendance

function Gatherings({ people, gatherings, reload }: { people: Person[]; gatherings: Gathering[]; reload: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [open, setOpen] = useState<Gathering | null>(null);
  const [kind, setKind] = useState<GatheringKind | "all">("all");
  const [draft, setDraft] = useState<{ kind: GatheringKind; title: string; date: string }>({ kind: "practice", title: "", date: todayIso() });
  const shown = gatherings.filter(g => kind === "all" || g.kind === kind).slice(0, 60);
  return (
    <>
      <form className="card new-gathering" onSubmit={async e => {
        e.preventDefault();
        let made: Gathering | null = null;
        if (await run(async () => { made = await store.attendance.saveGathering(null, { ...draft, title: draft.title.trim() || KIND_LABEL[draft.kind] }); })) {
          await reload();
          setOpen(made);
          setDraft(d => ({ ...d, title: "" }));
        }
      }}>
        <h2>Take attendance</h2>
        <div className="inline-form">
          <select value={draft.kind} onChange={e => setDraft(d => ({ ...d, kind: e.target.value as GatheringKind }))} aria-label="Kind">
            {GATHERING_KINDS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <input placeholder="Name (e.g. Wednesday practice, Prairie Brawl)" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} aria-label="Name" />
          <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} aria-label="Date" required />
          <button className="primary">Start check-in</button>
        </div>
      </form>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Kind">
          {(["all", ...GATHERING_KINDS] as const).map(k => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "all" ? "All" : `${KIND_LABEL[k]}s`}</button>)}
        </div>
      </div>
      {shown.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>What</th><th>Kind</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {shown.map(g => (
                <tr key={g.id}>
                  <td data-label="Date">{dateLabel(g.date)}</td>
                  <td data-label="What"><strong>{g.title || KIND_LABEL[g.kind]}</strong></td>
                  <td data-label="Kind"><Pill tone={g.kind === "practice" ? "later" : g.kind === "tournament" ? "soon" : "done"}>{KIND_LABEL[g.kind]}</Pill></td>
                  <td className="row-actions"><button className="ghost" onClick={() => setOpen(g)}>Check in</button></td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
      {open && <CheckIn gathering={open} people={people} onClose={() => { setOpen(null); void reload(); }} onDeleted={async () => { setOpen(null); await reload(); }} />}
    </>
  );
}

function CheckIn({ gathering, people, onClose, onDeleted }: { gathering: Gathering; people: Person[]; onClose: () => void; onDeleted: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [present, setPresent] = useState<Set<string> | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { store.attendance.present(gathering.id).then(ids => setPresent(new Set(ids)), () => setPresent(new Set())); }, [store, gathering.id]);
  const roster = people.filter(p => p.status !== "removed" || present?.has(p.id)).filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = async (p: Person) => {
    if (!present) return;
    const on = !present.has(p.id);
    setPresent(s => { const n = new Set(s); if (on) n.add(p.id); else n.delete(p.id); return n; });
    const ok = await run(() => store.attendance.setPresent(gathering.id, p.id, on));
    if (!ok) setPresent(s => { const n = new Set(s); if (on) n.delete(p.id); else n.add(p.id); return n; });
  };
  return (
    <Modal title={`${gathering.title || KIND_LABEL[gathering.kind]} · ${dateLabel(gathering.date)}`} onClose={onClose}>
      <p className="muted">{present ? `${present.size} present.` : ""} Tap everyone who's here. It saves as you go.</p>
      <input type="search" placeholder="Find someone" value={q} onChange={e => setQ(e.target.value)} aria-label="Find someone" />
      {!present ? <Loading /> : roster.length === 0 ? <Empty>No members in the tracker yet.</Empty> : (
        <div className="checkin">
          {roster.map(p => (
            <button key={p.id} className={present.has(p.id) ? "here" : undefined} aria-pressed={present.has(p.id)} onClick={() => toggle(p)}>
              <span aria-hidden>{present.has(p.id) ? "✓" : ""}</span>{p.name}{p.status === "away" && <small className="muted"> away</small>}
            </button>))}
        </div>)}
      <div className="form-actions">
        <button type="button" className="danger" onClick={async () => {
          if (!confirm("Delete this gathering and its attendance?")) return;
          if (await run(() => store.attendance.removeGathering(gathering.id), "Deleted")) await onDeleted();
        }}>Delete</button>
        <button className="primary" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Person } from "../data/attendance";
import { NO_SHOW_MONTHS, ago, isNoShow, timerState } from "../lib/attendance";
import { Money, Page, Pill, dateLabel, todayIso, useCan, useStore, useTable } from "../ui";
import { deadlineStatus } from "../lib/compliance";
import { isTransfer } from "../lib/transfers";

export function Dashboard() {
  const { session } = useStore();
  const money = useCan("money.view");
  const records = useCan("records.view");
  return (
    <Page title={`Hail, ${session.name.split(" ")[0]}`} intro="What needs you today, and where the club stands.">
      {money ? <ExecDashboard records={records} /> : <MemberHome />}
    </Page>
  );
}

function ExecDashboard({ records }: { records: boolean }) {
  const tx = useTable("transactions");
  const claims = useTable("reimbursements");
  const deadlines = useTable("compliance");
  const sponsors = useTable("sponsors");
  const gear = useTable("gear");
  const today = todayIso();
  const month = today.slice(0, 7);
  const balance = (tx.rows || []).reduce((s, t) => s + t.amount_cents, 0);
  const thisMonth = (tx.rows || []).filter(t => t.date.startsWith(month) && !isTransfer(t));
  const inMonth = thisMonth.filter(t => t.amount_cents > 0).reduce((s, t) => s + t.amount_cents, 0);
  const outMonth = thisMonth.filter(t => t.amount_cents < 0).reduce((s, t) => s - t.amount_cents, 0);
  const openClaims = (claims.rows || []).filter(c => c.status === "submitted" || c.status === "approved");
  const due = (deadlines.rows || []).filter(d => !d.done_on).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const pipeline = (sponsors.rows || []).filter(s => !["signed", "renewed", "lost"].includes(s.stage));
  const followUps = (sponsors.rows || []).filter(s => s.next_follow_up && s.next_follow_up <= today && s.stage !== "lost");
  const out = (gear.rows || []).filter(g => g.holder_name);
  return (
    <>
      <div className="stats">
        <Stat label="Balance (all accounts)" value={<Money cents={balance} />} to="/ledger" />
        <Stat label="In this month" value={<Money cents={inMonth} />} to="/ledger" />
        <Stat label="Out this month" value={<Money cents={outMonth} />} to="/ledger" />
        <Stat label="Claims waiting" value={openClaims.length} to="/claims" />
        {records && <Stat label="Sponsors in the pipeline" value={pipeline.length} to="/sponsors" />}
        {records && <Stat label="Gear on loan" value={out.length} to="/gear" />}
      </div>
      {records && (
        <div className="cards">
          <article className="card">
            <h2>Next deadlines</h2>
            {due.length === 0 ? <p className="muted">Nothing due.</p> : (
              <ul className="list">
                {due.map(d => {
                  const status = deadlineStatus(d.due, today, d.done_on);
                  return <li key={d.id}><span>{d.title}</span><Pill tone={status}>{status === "overdue" ? "Overdue" : dateLabel(d.due)}</Pill></li>;
                })}
              </ul>)}
            <Link to="/compliance">All deadlines</Link>
          </article>
          <article className="card">
            <h2>Sponsor follow-ups due</h2>
            {followUps.length === 0 ? <p className="muted">No follow-ups due.</p> : (
              <ul className="list">{followUps.map(s => <li key={s.id}><span>{s.name}</span><Pill tone="soon">{dateLabel(s.next_follow_up)}</Pill></li>)}</ul>)}
            <Link to="/sponsors">Sponsor pipeline</Link>
          </article>
          <AttendanceCard />
          <article className="card">
            <h2>Latest money</h2>
            <ul className="list">
              {(tx.rows || []).slice(0, 6).map(t => <li key={t.id}><span>{t.description}</span><Money cents={t.amount_cents} signed /></li>)}
            </ul>
            <Link to="/ledger">Open the ledger</Link>
          </article>
        </div>
      )}
    </>
  );
}

/** The 3-month no-show policy: who's past it and whose removal timer is running. */
function AttendanceCard() {
  const store = useStore();
  const [people, setPeople] = useState<Person[] | null>(null);
  useEffect(() => { store.attendance.people().then(setPeople, () => setPeople([])); }, [store]);
  const today = todayIso();
  const noShows = (people || []).filter(p => isNoShow({ ...p, last_seen: p.stats.last_seen }, today));
  const timers = (people || []).filter(p => p.status === "removal");
  return (
    <article className="card">
      <h2>Attendance</h2>
      {people === null ? <p className="muted">Checking…</p> : noShows.length === 0 && timers.length === 0 ? <p className="muted">Nobody past the {NO_SHOW_MONTHS}-month no-show line.</p> : (
        <ul className="list">
          {noShows.map(p => <li key={p.id}><span>{p.name}</span><Pill tone="overdue">{p.stats.last_seen ? ago(p.stats.last_seen, today) : "never seen"}</Pill></li>)}
          {timers.map(p => { const t = timerState(p, today); return <li key={p.id}><span>{p.name}{p.reply_text ? " · replied" : ""}</span><Pill tone="soon">{t.running && t.expired ? "Time's up" : t.running ? `${t.daysLeft} days left` : ""}</Pill></li>; })}
        </ul>)}
      <Link to="/attendance">Attendance tracker</Link>
    </article>
  );
}

function Stat({ label, value, to }: { label: string; value: React.ReactNode; to: string }) {
  return <Link className="stat" to={to}><span>{label}</span><strong>{value}</strong></Link>;
}

function MemberHome() {
  const waivers = useTable("waivers");
  const claims = useTable("reimbursements");
  const gear = useTable("gear");
  const season = new Date().getFullYear();
  const signed = (waivers.rows || []).some(w => w.season === season);
  return (
    <div className="cards">
      <article className="card">
        <h2>Season {season} waiver</h2>
        {waivers.rows === null ? <p className="muted">Checking…</p> : signed ? <p><Pill tone="done">Signed</Pill> You're cleared on paper for this season.</p>
          : <p><Pill tone="overdue">Not signed</Pill> Sign it before your next sparring session.</p>}
        <Link to="/waivers">{signed ? "View waiver" : "Sign the waiver"}</Link>
      </article>
      <article className="card">
        <h2>Your claims</h2>
        <p>{(claims.rows || []).filter(c => c.status === "submitted" || c.status === "approved").length} waiting</p>
        <Link to="/claims">Get paid back for club spending</Link>
      </article>
      <article className="card">
        <h2>Club gear you have</h2>
        {(gear.rows || []).length === 0 ? <p className="muted">None on loan.</p> : <ul className="list">{gear.rows!.map(g => <li key={g.id}>{g.name}</li>)}</ul>}
      </article>
      <article className="card">
        <h2>Pay dues or buy</h2>
        <Link to="/pay">Payment options</Link>
      </article>
    </div>
  );
}

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ReminderKind, ReminderLog, ReminderStatus } from "../data/reminders";
import type { SiteData } from "../data/website";
import { DEFAULT_SETTINGS, eventReminderAt, longDate, nextDuesDays, nextPractice, redDeerToday, sendHourLabel, type ReminderSettings, type Via } from "../lib/reminders";
import { Empty, Loading, Page, Pill, errorText, useAction, useCan, useStore, useToast } from "../ui";

const KIND: Record<ReminderKind, string> = {
  dues: "Dues", dues_followup: "Dues, second nudge", practice: "Practice", event: "Event", noshow_warning: "Attendance warning"
};
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);
const FOLLOWUP = [0, 3, 5, 7, 10, 14];
const PRACTICE_HOURS = [2, 3, 6, 12, 24, 48];
const EVENT_DAYS = [1, 2, 3, 5, 7, 14];
const WARN_DAYS = [7, 14, 21, 30];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const when = (d: Date) => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Edmonton" }).format(d);
const sentAt = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** Admins turn each automatic reminder on or off and choose when and how it goes out. The executive can look. */
export function Reminders() {
  const store = useStore();
  const toast = useToast();
  const run = useAction();
  const admin = useCan("access.manage");
  const [settings, setSettings] = useState<ReminderSettings | null | undefined>(undefined);
  const [log, setLog] = useState<ReminderLog[] | null>(null);
  const [status, setStatus] = useState<ReminderStatus | undefined>(undefined);
  const [site, setSite] = useState<SiteData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([store.reminders.settings(), store.reminders.log()]);
      setSettings(s); setLog(l);
    } catch (e) { toast(errorText(e), true); setSettings(null); setLog([]); }
  }, [store, toast]);
  useEffect(() => {
    void load();
    store.reminders.status().then(setStatus, () => setStatus(null));
    store.website.get().then(setSite, () => setSite(null));
  }, [load, store]);

  async function change(patch: Partial<ReminderSettings>, done: string) {
    if (!settings) return;
    const before = settings;
    setSettings({ ...settings, ...patch });
    if (!(await run(() => store.reminders.save(patch), done))) setSettings(before);
  }

  const s = settings || DEFAULT_SETTINGS;
  const off = !admin || !settings;

  return (
    <Page title="Reminders"
      intro="Automatic messages to members by Discord and email: monthly dues, practices, calendar events and the 3-month attendance policy. Each reminder goes out once, and the history below shows every one sent."
      actions={admin && settings && <button disabled={busy} onClick={async () => { setBusy(true); await run(async () => toast(await store.reminders.runNow())); setBusy(false); void load(); }}>{busy ? "Sending…" : "Send what's due now"}</button>}>
      {settings === undefined ? <Loading /> : (
        <>
          {settings === null && <p className="banner">The database update for reminders isn't applied yet (<code>20261112000000_reavers_app_reminders.sql</code>), so these settings can't be saved and nothing is sent.</p>}
          <SetupNote status={status} settings={s} />
          {!admin && <p className="muted small">Only an admin (the treasurer, president, a captain or the BuhurtOS owner) can change these.</p>}

          <div className="reminders">
            <section className="card reminder">
              <Head title="Monthly dues" on={s.dues_enabled} disabled={off} onToggle={v => change({ dues_enabled: v }, v ? "Dues reminders on" : "Dues reminders off")} />
              <p className="muted small">A private message to each active club member who hasn't paid this month. Anyone paid, waived or payment exempt is skipped.</p>
              <div className="reminder-fields">
                <Choice label="Send on the" value={s.dues_day} options={DAYS_OF_MONTH} show={n => `${ordinal(n)} of the month`} disabled={off} onPick={v => change({ dues_day: v }, "Saved")} />
                <Choice label="Second nudge" value={s.dues_followup_days} options={FOLLOWUP} show={n => (n ? `${n} days later` : "None")} disabled={off} onPick={v => change({ dues_followup_days: v }, "Saved")} />
                <ViaPick value={s.dues_via} disabled={off} discord="Discord DM" onPick={v => change({ dues_via: v }, "Saved")} />
              </div>
              {s.dues_enabled && <Next>{(() => { const d = nextDuesDays(s, redDeerToday()); return <>Next: {longDate(d.first)} at {sendHourLabel(s.send_hour)}{d.followup && <>, second nudge {longDate(d.followup)}</>}</>; })()}</Next>}
            </section>

            <section className="card reminder">
              <Head title="Practices" on={s.practice_enabled} disabled={off} onToggle={v => change({ practice_enabled: v }, v ? "Practice reminders on" : "Practice reminders off")} />
              <p className="muted small">A post in the members' Discord channel before each weekly practice on the Practices page, with the time, venue and fee.</p>
              <div className="reminder-fields">
                <Choice label="Send" value={s.practice_hours_before} options={PRACTICE_HOURS} show={n => `${n} hours before`} disabled={off} onPick={v => change({ practice_hours_before: v }, "Saved")} />
                <ViaPick value={s.practice_via} disabled={off} discord="Discord" onPick={v => change({ practice_via: v }, "Saved")} />
              </div>
              {s.practice_enabled && <Next>{(() => {
                const n = site && nextPractice(site.practices, new Date(), s.practice_hours_before);
                return n ? <>Next: {n.practice.label} practice, reminder {when(n.remindAt)}</> : site ? "No weekly practices are on." : "";
              })()}</Next>}
            </section>

            <section className="card reminder">
              <Head title="Calendar events" on={s.events_enabled} disabled={off} onToggle={v => change({ events_enabled: v }, v ? "Event reminders on" : "Event reminders off")} />
              <p className="muted small">A post before each public event on the Calendar page: demos, socials, tournaments, one-off practices. Private events (like executive meetings) are never posted.</p>
              <div className="reminder-fields">
                <Choice label="Send" value={s.events_days_before} options={EVENT_DAYS} show={n => (n === 1 ? "The day before" : `${n} days before`)} disabled={off} onPick={v => change({ events_days_before: v }, "Saved")} />
                <ViaPick value={s.events_via} disabled={off} discord="Discord" onPick={v => change({ events_via: v }, "Saved")} />
              </div>
              {s.events_enabled && <Next>{(() => {
                if (!site) return "";
                const today = redDeerToday();
                const now = new Date();
                const e = site.events.filter(x => x.is_public && x.event_date >= today && eventReminderAt(x.event_date, s) > now)
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
                return e ? <>Next: {e.title}, reminder {when(eventReminderAt(e.event_date, s))}</> : "No other public events coming up.";
              })()}</Next>}
            </section>

            <section className="card reminder">
              <Head title="Attendance" on={s.noshow_warn_enabled} disabled={off} onToggle={v => change({ noshow_warn_enabled: v }, v ? "Attendance warnings on" : "Attendance warnings off")} />
              <p className="muted small">A friendly Discord message to a member who is getting close to 3 months without coming out, before the captains are told. Members marked away are left alone.</p>
              <div className="reminder-fields">
                <Choice label="Warn them" value={s.noshow_warn_days} options={WARN_DAYS} show={n => `${n} days before 3 months`} disabled={off} onPick={v => change({ noshow_warn_days: v }, "Saved")} />
              </div>
              <label className="check reminder-check">
                <input type="checkbox" checked={s.noshow_enabled} disabled={off} onChange={e => change({ noshow_enabled: e.target.checked }, e.target.checked ? "Leadership post on" : "Leadership post off")} />
                Daily post to the leadership channel about no-shows and removal timers that ran out
              </label>
            </section>
          </div>

          <section className="card section reminder-time">
            <Choice label="Daily reminders go out at" value={s.send_hour} options={HOURS} show={sendHourLabel} disabled={off} onPick={v => change({ send_hour: v }, "Saved")} />
            <p className="muted small">Red Deer time, for dues, events and attendance warnings. Practice reminders go out the set number of hours before each practice.</p>
          </section>

          <h2>History</h2>
          {!log ? <Loading /> : log.length === 0 ? <Empty>No reminders sent yet.</Empty> : (
            <div className="table-wrap">
              <table className="reminder-log">
                <thead><tr><th>When</th><th>Reminder</th><th>To</th><th>How</th><th>Result</th></tr></thead>
                <tbody>
                  {log.map(l => (
                    <tr key={l.id}>
                      <td className="nowrap">{sentAt(l.sent_at)}</td>
                      <td><strong>{KIND[l.kind]}</strong><small className="muted block">{l.summary}</small></td>
                      <td>{l.recipient}</td>
                      <td>{l.via === "discord" ? "Discord" : "Email"}</td>
                      <td>{l.status === "sent" ? <Pill tone="done">Sent</Pill> : <><Pill tone={l.status === "failed" ? "overdue" : "soon"}>{l.status === "failed" ? "Failed" : "Skipped"}</Pill>{l.error && <small className="muted block">{l.error}</small>}</>}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </>)}
    </Page>
  );
}

function Head({ title, on, disabled, onToggle }: { title: string; on: boolean; disabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="reminder-head">
      <h2>{title}</h2>
      <button type="button" role="switch" aria-checked={on} aria-label={`${title} reminders`} className={on ? "switch on" : "switch"} disabled={disabled} onClick={() => onToggle(!on)}>
        <span aria-hidden="true" />{on ? "On" : "Off"}
      </button>
    </div>
  );
}

function Choice({ label, value, options, show, disabled, onPick }: { label: string; value: number; options: number[]; show: (n: number) => string; disabled: boolean; onPick: (n: number) => void }) {
  const list = options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
  return (
    <label className="reminder-field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={e => onPick(Number(e.target.value))}>
        {list.map(o => <option key={o} value={o}>{show(o)}</option>)}
      </select>
    </label>
  );
}

function ViaPick({ value, disabled, discord, onPick }: { value: Via; disabled: boolean; discord: string; onPick: (v: Via) => void }) {
  const opts: [Via, string][] = [["discord", discord], ["email", "Email"], ["both", "Both"]];
  return (
    <div className="reminder-field">
      <span>By</span>
      <div className="segmented" role="radiogroup" aria-label="Send by">
        {opts.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={value === v} aria-pressed={value === v} disabled={disabled} onClick={() => onPick(v)}>{l}</button>)}
      </div>
    </div>
  );
}

const Next = ({ children }: { children: ReactNode }) => (children ? <p className="reminder-next">{children}</p> : null);

/** Says which keys the server is missing for what's turned on, so a reminder never silently goes nowhere. */
function SetupNote({ status, settings: s }: { status: ReminderStatus | undefined; settings: ReminderSettings }) {
  if (status === undefined) return null;
  const any = s.dues_enabled || s.practice_enabled || s.events_enabled || s.noshow_warn_enabled;
  if (status === null) return any ? <p className="banner">The reminders function isn't on the server yet, so nothing goes out. Setup: <code>docs/reminders.md</code>.</p> : null;
  const uses = (via: Via, kind: "discord" | "email") => via === kind || via === "both";
  const missing: string[] = [];
  if (!status.schedule) missing.push("the hourly schedule (REAVERS_CRON_SECRET)");
  if (((s.dues_enabled && uses(s.dues_via, "discord")) || s.noshow_warn_enabled) && !status.discordDm) missing.push("the Discord bot for private messages (DISCORD_BOT_TOKEN)");
  if (((s.practice_enabled && uses(s.practice_via, "discord")) || (s.events_enabled && uses(s.events_via, "discord"))) && !status.discordChannel) missing.push("the members' channel webhook (DISCORD_MEMBERS_WEBHOOK)");
  if (((s.dues_enabled && uses(s.dues_via, "email")) || (s.practice_enabled && uses(s.practice_via, "email")) || (s.events_enabled && uses(s.events_via, "email"))) && !status.email) missing.push("email (RESEND_API_KEY and REMINDER_EMAIL_FROM)");
  if (!missing.length) return null;
  return <p className="banner">Still to set up on the server: {missing.join(", ")}. Until then those reminders are skipped and show as skipped below. Setup: <code>docs/reminders.md</code>.</p>;
}

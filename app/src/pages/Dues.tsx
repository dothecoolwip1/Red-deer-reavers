import { useEffect, useMemo, useState } from "react";
import type { ClubMembers } from "../data/website";
import type { Dues as DuesRecord, DuesMethod, SquarePaymentRow } from "../data/types";
import { duesGrid, lastMonths, unassignedDues, type DuesRow } from "../lib/dues";
import { monthLabel } from "../lib/square";
import { parseMoney } from "../lib/money";
import { Empty, Loading, Modal, Money, Page, dateLabel, todayIso, useAction, useCan, useStore, useTable } from "../ui";

const METHOD: Record<DuesMethod, string> = { square: "Square", cash: "Cash", etransfer: "e-Transfer", waived: "Waived", other: "Other" };
const TAG: Record<DuesMethod, string> = { square: "Square", cash: "Cash", etransfer: "e-Tr", waived: "Waived", other: "Other" };
const short = (month: string) => new Intl.DateTimeFormat("en-CA", { month: "short" }).format(new Date(`${month.slice(0, 7)}-15T12:00:00`));

export function Dues() {
  const store = useStore();
  const run = useAction();
  const canEdit = useCan("money.edit");
  const dues = useTable("dues");
  const payments = useTable("square_payments");
  const items = useTable("square_items");
  const [members, setMembers] = useState<ClubMembers | null | undefined>(undefined);
  const [cell, setCell] = useState<{ row: DuesRow; month: string } | null>(null);
  const [assigning, setAssigning] = useState<SquarePaymentRow | null>(null);
  useEffect(() => { store.website.clubMembers().then(setMembers, () => setMembers(null)); }, [store]);

  const months = useMemo(() => lastMonths(todayIso(), 6), []);
  const thisMonth = months[months.length - 1];
  const roster = members?.ok ? members.members.filter(m => m.status === "active" || m.status === "pending").map(m => ({ key: `membership:${m.membership_id}`, name: m.full_name })) : [];
  const grid = duesGrid(roster, dues.rows || [], months);
  const loose = unassignedDues(payments.rows || [], dues.rows || []);
  const price = (items.rows || []).find(i => i.kind === "dues" && i.active)?.price_cents ?? 0;
  const onRoster = grid.filter(r => r.onRoster);
  const paidNow = onRoster.filter(r => r.cells[thisMonth]).length;
  const collected = (dues.rows || []).filter(d => d.month === thisMonth).reduce((s, d) => s + d.amount_cents, 0);
  const reloadAll = async () => { await Promise.all([dues.reload(), payments.reload()]); };

  return (
    <Page title="Dues" intro="Monthly dues for everyone on the club roster. Paid through Square, they tick themselves off; cash, e-Transfer and waived months are marked here by treasury. The yearly membership (applications and AGM voting) stays in the members area.">
      {!dues.rows || members === undefined ? <Loading /> : (
        <>
          <div className="stats">
            <div className="stat"><span>{monthLabel(thisMonth)}</span><strong>{paidNow} of {onRoster.length}</strong><small>members paid or waived</small></div>
            <div className="stat"><span>Collected this month</span><strong><Money cents={collected} /></strong><small>{price ? <>Dues are <Money cents={price} /> a month</> : "Set the price under Pay the club"}</small></div>
            <div className="stat"><span>Waiting to be filed</span><strong>{loose.length}</strong><small>Square dues payments with no name</small></div>
          </div>
          {members && !members.ok && <p className="banner">{members.reason} Only people who have paid are listed.</p>}

          {loose.length > 0 && (
            <section className="card section">
              <h2>Square dues payments to file</h2>
              <p className="muted small">Paid on the card reader, or without saying who. Pick whose dues and which month.</p>
              <ul className="rows">
                {loose.map(p => (
                  <li key={p.id} className="row-line">
                    <span>{dateLabel(p.paid_at)} · <Money cents={p.amount_cents} /> · {p.buyer_name || p.buyer_email || (p.channel === "in_person" ? "card reader" : "online")}</span>
                    {canEdit && <button onClick={() => setAssigning(p)}>File it</button>}
                  </li>))}
              </ul>
            </section>)}

          {grid.length === 0 ? <Empty>No members or dues yet.</Empty> : (
            <div className="table-wrap short dues-wrap">
              <table className="dues">
                <thead><tr><th>Member</th>{months.map((m, i) => <th key={m} className={i < 3 ? "dues-cell older" : "dues-cell"}>{short(m)}</th>)}</tr></thead>
                <tbody>
                  {grid.map(row => (
                    <tr key={row.key}>
                      <td>
                        {row.name}
                        {!row.onRoster && <small className="muted block">Not matched to the roster{canEdit && roster.length > 0 && <> · <MatchButton row={row} roster={roster} dues={dues.rows!} onDone={reloadAll} /></>}</small>}
                      </td>
                      {months.map((m, i) => {
                        const d = row.cells[m];
                        const label = d ? TAG[d.method] : m < thisMonth ? "Unpaid" : "Due";
                        const tone = d ? (d.method === "waived" ? "waived" : "paid") : m < thisMonth ? "unpaid" : "due";
                        return (
                          <td key={m} className={i < 3 ? "dues-cell older" : "dues-cell"}>
                            <button className={`dues-mark ${tone}`} disabled={!canEdit} title={d ? `${METHOD[d.method]} on ${dateLabel(d.paid_on)}${d.note ? `: ${d.note}` : ""}` : `${row.name}, ${monthLabel(m)}: not paid`}
                              aria-label={`${row.name}, ${monthLabel(m)}: ${d ? METHOD[d.method] : label}`} onClick={() => setCell({ row, month: m })}>
                              {d ? (d.method === "waived" ? "–" : "✓") : "·"}<span>{label}</span>
                            </button>
                          </td>);
                      })}
                    </tr>))}
                </tbody>
              </table>
            </div>)}
          <p className="muted small">✓ paid · – waived · · not paid. {canEdit ? "Click a month to mark it." : "Treasury marks cash and e-Transfer payments."}</p>
        </>)}

      {cell && (
        <Modal title={`${cell.row.name}, ${monthLabel(cell.month)}`} onClose={() => setCell(null)}>
          <MarkForm existing={cell.row.cells[cell.month]} price={price} onSave={async v => {
            const d = cell.row.cells[cell.month];
            const ok = await run(() => d ? store.update("dues", d.id, v) : store.insert("dues", { ...v, member_key: cell.row.key, member_name: cell.row.name, member_user: cell.row.user, month: cell.month }), "Saved");
            if (ok) { setCell(null); await reloadAll(); }
          }} onClear={cell.row.cells[cell.month] ? async () => {
            if (await run(() => store.remove("dues", cell.row.cells[cell.month]!.id), "Cleared")) { setCell(null); await reloadAll(); }
          } : undefined} />
        </Modal>)}

      {assigning && (
        <Modal title="File a Square dues payment" onClose={() => setAssigning(null)}>
          <AssignForm payment={assigning} people={grid} months={[...months, nextMonth(thisMonth)]} onSave={async (row, month) => {
            const existing = row.cells[month];
            const v = { member_key: row.key, member_name: row.name, member_user: row.user, month, amount_cents: assigning.amount_cents, method: "square" as const, paid_on: assigning.paid_at.slice(0, 10), square_payment_id: assigning.square_payment_id, note: null };
            const ok = await run(() => existing ? store.update("dues", existing.id, v) : store.insert("dues", v), "Filed");
            if (ok) { setAssigning(null); await reloadAll(); }
          }} />
        </Modal>)}
    </Page>
  );
}

const nextMonth = (month: string) => { const d = new Date(`${month}T12:00:00`); d.setMonth(d.getMonth() + 1); return `${d.toISOString().slice(0, 7)}-01`; };

function MarkForm({ existing, price, onSave, onClear }: {
  existing?: DuesRecord; price: number; onSave: (v: Partial<DuesRecord>) => Promise<void>; onClear?: () => Promise<void>;
}) {
  const [method, setMethod] = useState<DuesMethod>(existing?.method ?? "cash");
  const [amount, setAmount] = useState(((existing?.amount_cents ?? price) / 100).toFixed(2));
  const [paidOn, setPaidOn] = useState(existing?.paid_on ?? todayIso());
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState("");
  return (
    <form className="form" onSubmit={async e => {
      e.preventDefault();
      const cents = method === "waived" ? 0 : parseMoney(amount);
      if (cents === null) return setError("Enter an amount like 30.00");
      await onSave({ method, amount_cents: cents, paid_on: paidOn, note: note.trim() || null });
    }}>
      {existing?.method === "square" && <p className="muted">Paid through Square. Changing it here doesn't touch the payment itself.</p>}
      <div className="segmented" role="radiogroup" aria-label="How it was paid">
        {(["cash", "etransfer", "square", "waived", "other"] as DuesMethod[]).map(m => (
          <button type="button" key={m} role="radio" aria-checked={method === m} className={method === m ? "on" : ""} onClick={() => setMethod(m)}>{METHOD[m]}</button>))}
      </div>
      <div className="grid">
        {method !== "waived" && <label><span>Amount</span><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></label>}
        <label><span>{method === "waived" ? "Decided on" : "Paid on"}</span><input type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} required /></label>
        <label className="wide"><span>Note</span><input value={note} onChange={e => setNote(e.target.value)} placeholder={method === "waived" ? "Why, e.g. volunteer coach" : ""} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {onClear && <button type="button" className="danger" onClick={onClear}>Mark not paid</button>}
        <button className="primary">Save</button>
      </div>
    </form>
  );
}

function AssignForm({ payment, people, months, onSave }: {
  payment: SquarePaymentRow; people: DuesRow[]; months: string[]; onSave: (row: DuesRow, month: string) => Promise<void>;
}) {
  const [key, setKey] = useState(people[0]?.key ?? "");
  const [month, setMonth] = useState(payment.dues_month ?? `${payment.paid_at.slice(0, 7)}-01`);
  const row = people.find(p => p.key === key);
  return (
    <form className="form" onSubmit={async e => { e.preventDefault(); if (row) await onSave(row, month); }}>
      <p><Money cents={payment.amount_cents} /> on {dateLabel(payment.paid_at)}{payment.buyer_name ? `, from ${payment.buyer_name}` : ""}. {payment.summary}</p>
      <div className="grid">
        <label><span>Whose dues</span><select value={key} onChange={e => setKey(e.target.value)}>{people.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
        <label><span>For</span><select value={month} onChange={e => setMonth(e.target.value)}>{[...new Set([...months, month])].sort().map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
      </div>
      {row?.cells[month] && <p className="muted small">{row.name} is already marked for {monthLabel(month)} ({METHOD[row.cells[month]!.method]}); this replaces it.</p>}
      <div className="form-actions"><button className="primary" disabled={!row}>File it</button></div>
    </form>
  );
}

/** Someone paid from the app or under a name: move all their months onto a roster member, and future payments follow. */
function MatchButton({ row, roster, dues, onDone }: { row: DuesRow; roster: { key: string; name: string }[]; dues: DuesRecord[]; onDone: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  return (
    <select className="kind-pick" aria-label={`Match ${row.name} to a roster member`} value="" onChange={async e => {
      const to = roster.find(r => r.key === e.target.value);
      if (!to) return;
      const taken = new Set(dues.filter(d => d.member_key === to.key).map(d => d.month));
      const mine = dues.filter(d => d.member_key === row.key);
      if (mine.some(d => taken.has(d.month)) && !confirm(`${to.name} already has some of these months marked. Keep theirs and drop the duplicates?`)) return;
      if (await run(async () => {
        for (const d of mine) {
          if (taken.has(d.month)) await store.remove("dues", d.id);
          else await store.update("dues", d.id, { member_key: to.key, member_name: to.name });
        }
      }, `Matched to ${to.name}`)) await onDone();
    }}>
      <option value="">Match to…</option>
      {roster.map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
    </select>
  );
}

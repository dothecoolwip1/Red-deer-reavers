import { useMemo, useState } from "react";
import type { SquarePaymentRow } from "../data/types";
import { KIND_LABEL, KINDS, type Kind } from "../lib/square";
import { Empty, Loading, Money, Page, Pill, dateLabel, downloadCsv, todayIso, useAction, usePage, useStore, useTable } from "../ui";
import { publicPayUrl } from "./Pay";

const monthOf = (iso: string) => iso.slice(0, 7);
const monthName = (ym: string) => new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(new Date(`${ym}-15T12:00:00`));
const shift = (ym: string, by: number) => { const d = new Date(`${ym}-15T12:00:00`); d.setMonth(d.getMonth() + by); return d.toISOString().slice(0, 7); };

/** What each kind brought in, counting a mixed sale's lines under their own kinds. */
export function totalsByKind(rows: SquarePaymentRow[]): Record<Kind, number> {
  const out = Object.fromEntries(KINDS.map(k => [k, 0])) as Record<Kind, number>;
  for (const r of rows) {
    const lines = r.items.length ? r.items : [{ kind: r.kind === "mixed" ? "other" : r.kind, amount_cents: r.amount_cents }];
    const sum = lines.reduce((s, l) => s + l.amount_cents, 0);
    // Tips and rounding go with the biggest line, the same way the ledger books them.
    const biggest = lines.reduce((a, b) => (b.amount_cents > a.amount_cents ? b : a));
    for (const l of lines) out[l.kind as Kind] += l.amount_cents + (l === biggest ? r.amount_cents - sum : 0);
  }
  return out;
}

export function Sales() {
  const store = useStore();
  const run = useAction();
  const canEdit = usePage("sales") === 2;
  const { rows, reload } = useTable("square_payments");
  const [month, setMonth] = useState(monthOf(todayIso()));
  const [kind, setKind] = useState<"all" | Kind>("all");
  const inMonth = useMemo(() => (rows || []).filter(r => monthOf(r.paid_at) === month), [rows, month]);
  const shown = kind === "all" ? inMonth : inMonth.filter(r => r.kind === kind || r.items.some(i => i.kind === kind));
  const byKind = totalsByKind(inMonth);
  const gross = inMonth.reduce((s, r) => s + r.amount_cents, 0);
  const fees = inMonth.reduce((s, r) => s + r.fee_cents, 0);
  const refunds = inMonth.reduce((s, r) => s + r.refunded_cents, 0);
  const atTable = inMonth.filter(r => r.channel === "in_person").length;

  return (
    <Page title="Square sales" intro={<>Every Square payment, online and on the card reader at the table, recorded the moment it goes through. Each one is also in the Ledger under the Square account, with Square's fee as its own line. <a href={publicPayUrl()} target="_blank" rel="noreferrer">Open pay page</a> · <a href="https://app.squareup.com/dashboard/sales/transactions" target="_blank" rel="noreferrer">Square dashboard</a></>}
      actions={<button onClick={() => downloadCsv(`reavers-square-${month}.csv`, [["Date", "What", "Kind", "Who", "Email", "Where", "Paid", "Fee", "Refunded", "Square payment"],
        ...shown.map(r => [r.paid_at.slice(0, 10), r.summary, KIND_LABEL[r.kind], r.buyer_name, r.buyer_email, r.channel === "in_person" ? "At the table" : "Online", (r.amount_cents / 100).toFixed(2), (r.fee_cents / 100).toFixed(2), (r.refunded_cents / 100).toFixed(2), r.square_payment_id])])}>Export CSV</button>}>
      <div className="cal-bar">
        <button className="ghost" onClick={() => setMonth(m => shift(m, -1))} aria-label="Previous month">‹</button>
        <h2 style={{ margin: 0 }}>{monthName(month)}</h2>
        <button className="ghost" onClick={() => setMonth(m => shift(m, 1))} aria-label="Next month">›</button>
      </div>
      {!rows ? <Loading /> : (
        <>
          <div className="stats">
            <div className="stat"><span>Taken in</span><strong><Money cents={gross} /></strong><small>{inMonth.length} payments · {atTable} at the table</small></div>
            <div className="stat"><span>After Square's fees</span><strong><Money cents={gross - fees - refunds} /></strong><small><Money cents={fees} /> in fees{refunds ? <> · <Money cents={refunds} /> refunded</> : null}</small></div>
            {KINDS.filter(k => k !== "other" || byKind.other).map(k => (
              <button key={k} className={kind === k ? "stat picked" : "stat"} onClick={() => setKind(kind === k ? "all" : k)} aria-pressed={kind === k}>
                <span>{KIND_LABEL[k]}</span><strong><Money cents={byKind[k]} /></strong>
              </button>))}
          </div>
          {kind !== "all" && <p className="muted">Showing {KIND_LABEL[kind].toLowerCase()} only. <button className="ghost" onClick={() => setKind("all")}>Show everything</button></p>}
          {shown.length === 0 ? <Empty>No Square payments in {monthName(month)}{kind !== "all" ? ` for ${KIND_LABEL[kind].toLowerCase()}` : ""}.</Empty> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>What</th><th>Who</th><th>Where</th><th className="num">Paid</th><th className="num">Fee</th></tr></thead>
                <tbody>
                  {shown.map(r => (
                    <tr key={r.id} className={r.refunded_cents >= r.amount_cents ? "dim" : ""}>
                      <td data-label="Date">{dateLabel(r.paid_at)}</td>
                      <td data-label="What">
                        {r.summary || "Payment"}
                        <div className="tags">
                          {canEdit ? (
                            <select className="kind-pick" aria-label="What this payment was for" value={r.kind === "mixed" ? "" : r.kind}
                              onChange={async e => { if (await run(() => store.setPaymentKind(r.id, e.target.value as Kind), "Updated, and its ledger lines too")) await reload(); }}>
                              {r.kind === "mixed" && <option value="">{KIND_LABEL.mixed}</option>}
                              {KINDS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                            </select>) : <Pill>{KIND_LABEL[r.kind]}</Pill>}
                          {r.dues_month && <Pill tone="later">for {monthName(r.dues_month.slice(0, 7))}</Pill>}
                          {r.refunded_cents > 0 && <Pill tone="overdue">refunded <Money cents={r.refunded_cents} /></Pill>}
                        </div>
                      </td>
                      <td data-label="Who">{r.buyer_name || <span className="muted">-</span>}{r.buyer_email && <small className="muted block">{r.buyer_email}</small>}</td>
                      <td data-label="Where">{r.channel === "in_person" ? "At the table" : "Online"}{r.receipt_url && <small className="block"><a href={r.receipt_url} target="_blank" rel="noreferrer">Receipt</a></small>}</td>
                      <td data-label="Paid" className="num"><Money cents={r.amount_cents} /></td>
                      <td data-label="Fee" className="num muted"><Money cents={r.fee_cents} /></td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </>)}
    </Page>
  );
}

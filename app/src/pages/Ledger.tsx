import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/categories";
import type { Transaction } from "../data/types";
import { guessMapping, parseCsv, rowsToTransactions, type ColumnMapping } from "../lib/csv";
import { markDuplicates } from "../lib/dedupe";
import { isTransfer, withStripePayoutTransfers } from "../lib/transfers";
import { formatMoney } from "../lib/money";
import { Empty, Loading, Modal, Money, Page, Pill, RecordForm, dateLabel, downloadCsv, todayIso, useAction, useCan, useStore, useTable, type Field } from "../ui";

const FIELDS: Field[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "amount_cents", label: "Amount (negative for money out)", type: "money", required: true, hint: "e.g. -400 for rent, 60 for dues" },
  { key: "description", label: "Description", required: true, wide: true },
  { key: "category", label: "Category", type: "select", options: CATEGORIES },
  { key: "account", label: "Account", hint: "Chequing, Savings, Cash box, Stripe…" },
  { key: "notes", label: "Notes", type: "textarea" }
];

export function Ledger() {
  const { rows, reload } = useTable("transactions");
  const store = useStore();
  const run = useAction();
  const canEdit = useCan("money.edit");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [editing, setEditing] = useState<Transaction | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [receiptFor, setReceiptFor] = useState<Transaction | null>(null);

  const months = useMemo(() => [...new Set((rows || []).map(r => r.date.slice(0, 7)))].sort().reverse(), [rows]);
  const shown = useMemo(() => (rows || []).filter(r =>
    (!category || r.category === category) && (!month || r.date.startsWith(month)) &&
    (!q || `${r.description} ${r.notes || ""} ${r.account}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || "").localeCompare(a.created_at || "")), [rows, q, category, month]);
  const real = shown.filter(r => !isTransfer(r));
  const moneyIn = real.filter(r => r.amount_cents > 0).reduce((s, r) => s + r.amount_cents, 0);
  const moneyOut = real.filter(r => r.amount_cents < 0).reduce((s, r) => s - r.amount_cents, 0);

  return (
    <Page
      title="Ledger"
      intro="Every dollar in and out. Import your bank's CSV export each month, then give each line a category and a receipt."
      actions={<>
        <button onClick={() => downloadCsv(`reavers-ledger-${todayIso()}.csv`, [["Date", "Description", "Category", "Account", "Amount", "Source", "Notes"], ...shown.map(r => [r.date, r.description, r.category, r.account, (r.amount_cents / 100).toFixed(2), r.source, r.notes])])}>Export CSV</button>
        {canEdit && <button onClick={() => setImporting(true)}>Import bank CSV</button>}
        {canEdit && <button className="primary" onClick={() => setEditing("new")}>Add entry</button>}
      </>}
    >
      <div className="toolbar">
        <input type="search" placeholder="Search descriptions" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the ledger" />
        <select value={month} onChange={e => setMonth(e.target.value)} aria-label="Month">
          <option value="">All months</option>{months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <p className="totals">In <Money cents={moneyIn} /> · Out <Money cents={moneyOut} /> · Net <Money cents={moneyIn - moneyOut} signed /> <span className="muted">({shown.length} lines; transfers between accounts not counted)</span></p>
      {!rows ? <Loading /> : shown.length === 0 ? <Empty>No entries match.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id}>
                  <td data-label="Date">{dateLabel(r.date)}</td>
                  <td data-label="Description">{r.description}{r.source !== "manual" && <> <Pill>{r.source}</Pill></>}{r.notes && <small className="muted block">{r.notes}</small>}</td>
                  <td data-label="Category">{r.category || <Pill tone="soon">Needs a category</Pill>}</td>
                  <td data-label="Amount" className="num"><Money cents={r.amount_cents} signed /></td>
                  <td className="row-actions">
                    {r.receipt_path ? <ReceiptLink path={r.receipt_path} /> : canEdit && <button className="ghost" onClick={() => setReceiptFor(r)}>Add receipt</button>}
                    {canEdit && <button className="ghost" onClick={() => setEditing(r)}>Edit</button>}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
      {editing && (
        <Modal title={editing === "new" ? "Add entry" : "Edit entry"} onClose={() => setEditing(null)}>
          <RecordForm fields={FIELDS} initial={editing === "new" ? { date: todayIso(), account: "Chequing" } : editing}
            onSubmit={async v => {
              const ok = await run(() => editing === "new" ? store.insert("transactions", { ...v, source: "manual" } as Partial<Transaction>) : store.update("transactions", editing.id, v as Partial<Transaction>), "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing === "new" ? undefined : async () => {
              if (confirm("Delete this entry?") && await run(() => store.remove("transactions", editing.id), "Deleted")) { setEditing(null); await reload(); }
            }} />
        </Modal>)}
      {receiptFor && (
        <Modal title="Attach a receipt" onClose={() => setReceiptFor(null)}>
          <p>{receiptFor.description} · {formatMoney(receiptFor.amount_cents)}</p>
          <input type="file" accept="image/*,application/pdf" capture="environment" onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ok = await run(async () => {
              const path = await store.uploadReceipt(file);
              await store.update("transactions", receiptFor.id, { receipt_path: path });
            }, "Receipt attached");
            if (ok) { setReceiptFor(null); await reload(); }
          }} />
        </Modal>)}
      {importing && <ImportDialog existing={rows || []} onClose={() => setImporting(false)} onDone={reload} />}
    </Page>
  );
}

export function ReceiptLink({ path }: { path: string }) {
  const store = useStore();
  return <button className="ghost" onClick={async () => {
    const url = await store.receiptUrl(path);
    if (url) window.open(url, "_blank", "noopener"); else alert("The receipt can't be opened here (sample data).");
  }}>Receipt</button>;
}

function ImportDialog({ existing, onClose, onDone }: { existing: Transaction[]; onClose: () => void; onDone: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [grid, setGrid] = useState<string[][] | null>(null);
  const [map, setMap] = useState<ColumnMapping | null>(null);
  const [account, setAccount] = useState("Chequing");
  const [busy, setBusy] = useState(false);
  const headers = grid?.[0] || [];
  const preview = useMemo(() => {
    if (!grid || !map) return null;
    const { transactions, errors } = rowsToTransactions(grid.slice(1), map);
    return { rows: markDuplicates(transactions, existing), errors };
  }, [grid, map, existing]);
  const fresh = preview?.rows.filter(r => !r.duplicate) || [];

  const column = (label: string, key: keyof ColumnMapping) => (
    <label><span>{label}</span>
      <select value={map?.[key] ?? ""} onChange={e => setMap(m => ({ ...(m as ColumnMapping), [key]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
        <option value="">(none)</option>{headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
      </select>
    </label>);

  return (
    <Modal title="Import a bank CSV" onClose={onClose}>
      <p>In online banking, download the account activity as CSV, then pick the file. Lines already in the ledger are skipped, and Stripe payouts are booked as transfers because the payments were already recorded when they happened.</p>
      <input type="file" accept=".csv,text/csv" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const parsed = parseCsv(await file.text());
        setGrid(parsed);
        setMap(parsed[0] ? guessMapping(parsed[0]) : null);
      }} />
      {grid && map && preview && (
        <>
          <div className="grid">
            {column("Date column", "date")}
            {column("Description column", "description")}
            {column("Amount column (signed)", "amount")}
            {column("Money out column", "debit")}
            {column("Money in column", "credit")}
            <label><span>Account</span><input value={account} onChange={e => setAccount(e.target.value)} /></label>
          </div>
          <p><strong>{fresh.length}</strong> new lines, {preview.rows.length - fresh.length} already in the ledger{preview.errors.length ? `, ${preview.errors.length} skipped` : ""}.</p>
          {preview.errors.length > 0 && <details><summary>Skipped rows</summary><ul>{preview.errors.slice(0, 20).map(e => <li key={e}>{e}</li>)}</ul></details>}
          <div className="table-wrap short">
            <table><tbody>
              {preview.rows.slice(0, 12).map((r, i) => (
                <tr key={i} className={r.duplicate ? "dim" : ""}><td>{r.date}</td><td>{r.description}</td><td className="num"><Money cents={r.amount_cents} signed /></td><td>{r.duplicate && <Pill>Already in</Pill>}</td></tr>))}
            </tbody></table>
          </div>
          <div className="form-actions">
            <button className="primary" disabled={busy || fresh.length === 0} onClick={async () => {
              setBusy(true);
              const ok = await run(() => store.insertMany("transactions", withStripePayoutTransfers(fresh.map(({ duplicate: _d, ...t }) => t), account).map(t => ({ ...t, source: "csv" as const }))), `Imported ${fresh.length} lines`);
              setBusy(false);
              if (ok) { onClose(); await onDone(); }
            }}>Import {fresh.length} lines</button>
          </div>
        </>)}
    </Modal>
  );
}

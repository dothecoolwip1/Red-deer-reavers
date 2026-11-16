import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SquarePaymentRow } from "../data/types";
import { parseCsv } from "../lib/csv";
import { cashBoxSheet, editionSheets, expenseSheet, fighterSheet, overviewSheet, saleSheet, statSheet, summarySheet } from "../lib/tournamentWorkbook";
import { downloadXlsx, type Sheet } from "../lib/xlsx";
import { formatMoney, parseMoney } from "../lib/money";
import {
  DENOMS, EXPENSE_CATEGORIES, EXPENSE_LABEL, METHODS, METHOD_LABEL, PRICE_LIST, STATUSES, STATUS_LABEL, STATUS_TONE,
  byEvent, change, countTotal, denomLabel, editionCode, floatPlan, formatMinutes, ledgerLinesFor, parseMinutes,
  clubPaid, registrationMatches, saleKind, squareCsvLines, squareSaleLines, summarize,
  type CashBox, type Counts, type Method, type Summary, type Tournament, type TournamentExpense, type TournamentFighter, type TournamentSale
} from "../lib/tournaments";
import { Empty, Loading, Modal, Money, Page, Pill, RecordForm, dateLabel, todayIso, useAction, usePage, useStore, useTable, useToast, type Field } from "../ui";

type Data = { fighters: TournamentFighter[]; sales: TournamentSale[]; expenses: TournamentExpense[]; boxes: CashBox[] };
const methodLabel = (m: Method | null) => (m ? METHOD_LABEL[m] : "-");
const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((s, r) => s + f(r), 0);
const of = <T extends { tournament_id: string }>(rows: T[] | null, id: string) => (rows || []).filter(r => r.tournament_id === id);
const visitors = (t: Tournament) => sum(t.spectators || [], d => d.count);
const slug = (t: Tournament) => t.code.toLowerCase();
const METHOD_LABELS: Record<string, string> = { "": "-", ...METHOD_LABEL };

/** Green when over or even, red when short. */
const OverShort = ({ cents }: { cents: number }) =>
  <strong className={cents < 0 ? "money short" : "money in"}>{cents === 0 ? "Even" : `${formatMoney(Math.abs(cents))} ${cents > 0 ? "over" : "short"}`}</strong>;

const pct = (value: number, of: number) => (of > 0 ? Math.max(0, Math.min(100, (value / of) * 100)) : 0);

/** Collected against expected: a gilt bar, green once it's all in. */
function Meter({ value, of, label }: { value: number; of: number; label: ReactNode }) {
  const p = pct(value, of);
  return (
    <div className="tour-meter">
      <div className="tour-meter-label"><span>{label}</span><b>{of > 0 ? `${Math.round((value / of) * 100)}%` : "-"}</b></div>
      <div className="tour-meter-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label="Collected of expected">
        <div className={`tour-meter-fill${value >= of && of > 0 ? " done" : ""}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

const MiniBar = ({ value, of }: { value: number; of: number }) =>
  <span className="tour-minibar" aria-hidden="true"><span style={{ width: `${pct(value, of)}%` }} className={value >= of ? "done" : ""} /></span>;

/** Who paid, who owes and who didn't have to: one bar split by status. */
function FighterBar({ s }: { s: Summary }) {
  const parts = [
    { key: "paid", label: "Paid", n: s.fighters.paid },
    { key: "owes", label: "Owe", n: s.fighters.owing.length },
    { key: "waived", label: "Waived", n: s.fighters.waived },
    { key: "free", label: "Not needed", n: s.fighters.notNeeded }
  ];
  const total = parts.reduce((a, p) => a + p.n, 0);
  return (
    <div className="stat tour-fighterbar">
      <span>Fighters</span>
      <strong>{total}</strong>
      <div className="tour-stack" role="img" aria-label={parts.map(p => `${p.n} ${p.label.toLowerCase()}`).join(", ")}>
        {parts.filter(p => p.n).map(p => <span key={p.key} className={`seg ${p.key}`} style={{ flexGrow: p.n }} title={`${p.label}: ${p.n}`} />)}
      </div>
      <ul className="tour-legend">{parts.map(p => <li key={p.key}><i className={`dot ${p.key}`} />{p.label} <b>{p.n}</b></li>)}</ul>
    </div>
  );
}

function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="tour-section">
      <header className="tour-head"><h2>{title}</h2>{actions && <div className="row-actions">{actions}</div>}</header>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ exports (Excel workbooks: one per section, an edition, or everything)

const xlsx = (file: string, sheets: Sheet[], title: string) => downloadXlsx(`${file}-${todayIso()}.xlsx`, sheets, title);

// ------------------------------------------------------------------ the page

export function Tournaments() {
  const store = useStore();
  const run = useAction();
  const canEdit = usePage("tournaments") === 2;
  const canPost = canEdit && store.session.pages.ledger === 2;
  const editions = useTable("tournaments");
  const fighters = useTable("tournament_fighters");
  const sales = useTable("tournament_sales");
  const expenses = useTable("tournament_expenses");
  const boxes = useTable("tournament_cash_boxes");
  const [view, setView] = useState<"edition" | "all">("edition");
  const [picked, setPicked] = useState<string>("");
  const [editing, setEditing] = useState<Tournament | "new" | null>(null);

  const sorted = useMemo(() => [...(editions.rows || [])].sort((a, b) => b.year - a.year || (b.starts_on || "").localeCompare(a.starts_on || "") || a.name.localeCompare(b.name)), [editions.rows]);
  const current = sorted.find(t => t.id === picked) ?? sorted[0];
  const dataFor = (id: string): Data => ({ fighters: of(fighters.rows, id), sales: of(sales.rows, id), expenses: of(expenses.rows, id), boxes: of(boxes.rows, id) });
  const all = sorted.map(t => { const d = dataFor(t.id); return { t, d, s: summarize(d.fighters, d.sales, d.expenses, d.boxes) }; });
  const reloadAll = async () => { await Promise.all([editions.reload(), fighters.reload(), sales.reload(), expenses.reload(), boxes.reload()]); };
  const loading = !editions.rows || !fighters.rows || !sales.rows || !expenses.rows || !boxes.rows;

  return (
    <Page title="Tournaments" intro={<>Money and stats for every tournament the Reavers host, one edition per year. Card and cash sales rung up on Square come in from <Link to="/sales">Square sales</Link> or a Square export, so nothing is typed twice. Monthly dues stay out.</>}
      actions={<>
        <button onClick={() => xlsx("reavers-tournaments", [overviewSheet(all, todayIso()), ...all.flatMap(r => editionSheets(r.t, r.d, todayIso(), r.t.code))], "Reavers tournaments")} disabled={loading || !all.length}>Export everything</button>
        {canEdit && <button className="primary" onClick={() => setEditing("new")}>New edition</button>}
      </>}>
      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Tournament views">
          <button role="tab" aria-selected={view === "edition"} onClick={() => setView("edition")}>Edition summary</button>
          <button role="tab" aria-selected={view === "all"} onClick={() => setView("all")}>All tournaments</button>
        </div>
        {view === "edition" && sorted.length > 0 && (
          <select aria-label="Edition" value={current?.id ?? ""} onChange={e => setPicked(e.target.value)}>
            {sorted.map(t => <option key={t.id} value={t.id}>{t.code} · {t.name} {t.year}</option>)}
          </select>)}
      </div>
      {loading ? <Loading /> : sorted.length === 0 ? <Empty>No tournaments yet.{canEdit && " Add the first edition with New edition."}</Empty>
        : view === "all" ? <AllTournaments rows={all} onPick={id => { setPicked(id); setView("edition"); }} />
        : current && <Edition t={current} data={dataFor(current.id)} canEdit={canEdit} canPost={canPost} onEdit={() => setEditing(current)} reload={reloadAll} />}
      {editing && (
        <Modal title={editing === "new" ? "New edition" : `Edit ${editing.code}`} onClose={() => setEditing(null)}>
          <EditionForm initial={editing === "new" ? null : editing} onSave={async row => {
            const ok = await run(() => editing === "new" ? store.insert("tournaments", row) : store.update("tournaments", editing.id, row), "Saved");
            if (ok) { setEditing(null); await editions.reload(); }
          }} onDelete={editing === "new" ? undefined : async () => {
            if (!confirm(`Delete ${editing.code} with all its fighters, sales, expenses and cash counts?`)) return;
            if (await run(() => store.remove("tournaments", editing.id), "Deleted")) { setEditing(null); setPicked(""); await reloadAll(); }
          }} />
        </Modal>)}
    </Page>
  );
}

// ------------------------------------------------------------------ one edition

function Edition({ t, data, canEdit, canPost, onEdit, reload }: { t: Tournament; data: Data; canEdit: boolean; canPost: boolean; onEdit: () => void; reload: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const s = summarize(data.fighters, data.sales, data.expenses, data.boxes);
  const today = todayIso();
  const save = (part: string, sheets: Sheet[]) => xlsx(`reavers-${slug(t)}-${part}`, sheets, `${t.name} ${t.year}`);
  const days = [t.starts_on, t.ends_on].filter(Boolean).map(d => dateLabel(d)).filter((d, i, a) => a.indexOf(d) === i).join(" to ");

  async function postToLedger() {
    const lines = ledgerLinesFor(t, data.fighters, data.sales, data.expenses, todayIso());
    const prefix = `tournament-${t.code}-`;
    const old = (await store.list("transactions")).filter(x => x.source === "tournament" && x.external_id?.startsWith(prefix));
    if (!confirm(`Post ${t.code} to the ledger? ${lines.length} lines (fees, sales and expenses by payment method)${old.length ? ` replace the ${old.length} posted before` : ""}. Square sales are already in the ledger and are left out.`)) return;
    await run(async () => {
      for (const x of old) await store.remove("transactions", x.id);
      if (lines.length) await store.insertMany("transactions", lines);
    }, `Posted ${lines.length} lines to the ledger`);
  }

  return (
    <>
      <section className="tour-hero" aria-labelledby="tour-hero-name">
        <span className="tour-hero-year" aria-hidden="true">{t.year}</span>
        <div className="tour-hero-top">
          <div>
            <h2 id="tour-hero-name">{t.name} {t.year}</h2>
            <dl className="tour-hero-facts">
              {days && <div><dt>Dates</dt><dd>{days}</dd></div>}
              {t.venue && <div><dt>Venue</dt><dd>{t.venue}</dd></div>}
              <div><dt>Fighter fee</dt><dd>{formatMoney(t.fighter_fee_cents)}</dd></div>
              <div><dt>Short ID</dt><dd className="tour-code">{t.code}</dd></div>
            </dl>
          </div>
          <div className="row-actions">
            <button onClick={() => save("all", editionSheets(t, data, today))}>Export edition</button>
            {canPost && <button onClick={postToLedger}>Post to ledger</button>}
            {canEdit && <button onClick={onEdit}>Edit edition and stats</button>}
          </div>
        </div>
        <div className="tour-purse">
          <div><span>Money in</span><strong><Money cents={s.totalIn} /></strong></div>
          <div><span>Money out</span><strong><Money cents={s.totalOut} /></strong></div>
          <div className="tour-net"><span>Net</span><strong className={s.net < 0 ? "money short" : "money in"}>{formatMoney(s.net)}</strong>
            {s.donated > 0 && <small>{formatMoney(s.netIfPaid)} if the club had paid the {formatMoney(s.donated)} covered out of pocket</small>}</div>
        </div>
        <Meter value={s.totalIn} of={s.expectedIn} label={<>Collected <Money cents={s.totalIn} /> of <Money cents={s.expectedIn} /> expected</>} />
      </section>

      <div className="tour-glance">
        <FighterBar s={s} />
        <div className="stat"><span>Still owing</span><strong><span className={s.fees.owing ? "money short" : "money in"}>{formatMoney(s.fees.owing)}</span></strong><small>{s.fighters.owing.length ? `${s.fighters.owing.length} ${s.fighters.owing.length === 1 ? "fighter" : "fighters"}` : "Everyone's paid up"}</small></div>
        <div className="stat"><span>Merch sold</span><strong><Money cents={s.sales.merch} /></strong><small>{s.sales.merchQty} items</small></div>
        <div className="stat"><span>Through Square</span><strong><Money cents={s.sales.card} /></strong><small><Link to="/sales">Square sales</Link></small></div>
      </div>

      <Section title="Expected and collected, by payment method" actions={<button onClick={() => save("summary", [summarySheet(t, data, today)])}>Export</button>}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Method</th><th className="num">Expected</th><th className="num">Collected</th><th className="num">Difference</th></tr></thead>
            <tbody>
              {s.byMethod.filter(m => m.expected || m.collected).map(m => (
                <tr key={m.method}><td data-label="Method">{METHOD_LABEL[m.method]}</td><td data-label="Expected" className="num"><Money cents={m.expected} /></td>
                  <td data-label="Collected" className="num"><Money cents={m.collected} /><MiniBar value={m.collected} of={Math.max(m.expected, m.collected)} /></td>
                  <td data-label="Difference" className="num"><span className={m.collected < m.expected ? "money short" : "money in"}>{formatMoney(m.collected - m.expected)}</span></td></tr>))}
              <tr className="total"><td data-label="Method">Total</td><td data-label="Expected" className="num"><Money cents={s.expectedIn} /></td><td data-label="Collected" className="num"><Money cents={s.totalIn} /></td>
                <td data-label="Difference" className="num"><span className={s.totalIn < s.expectedIn ? "money short" : "money in"}>{formatMoney(s.totalIn - s.expectedIn)}</span></td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">Fighter fees count toward expected; those who didn't have to pay don't. Sales are counted as collected when they're entered.</p>
      </Section>

      {s.fighters.owing.length > 0 && (
        <div className="card owe-card">
          <h2>Still owes</h2>
          <ul className="list">{s.fighters.owing.map(f => <li key={f.id}><span>{f.name} <small className="muted">{methodLabel(f.method)}</small></span><span className="money short">{formatMoney(Math.max(0, f.fee_cents - f.paid_cents))}</span></li>)}</ul>
        </div>)}

      <Fighters t={t} rows={data.fighters} canEdit={canEdit} reload={reload} onExport={() => save("fighters", [fighterSheet(t, data.fighters, today)])} />
      <Sales t={t} rows={data.sales} canEdit={canEdit} reload={reload} onExport={() => save("sales", [saleSheet(t, data.sales, today)])} />
      <Expenses t={t} rows={data.expenses} canEdit={canEdit} reload={reload} onExport={() => save("expenses", [expenseSheet(t, data.expenses, today)])} />
      <CashBoxes t={t} rows={data.boxes} summary={s} canEdit={canEdit} reload={reload} onExport={() => save("cash-boxes", [cashBoxSheet(t, data.boxes, today)])} />
      <Stats t={t} data={data} onExport={() => save("stats", [statSheet(t, data, today)])} />
    </>
  );
}

// ------------------------------------------------------------------ fighters

const FIGHTER_FIELDS: Field[] = [
  { key: "name", label: "Name", required: true },
  { key: "club", label: "Club" },
  { key: "divisions", label: "Divisions", hint: "Separate with commas", wide: true },
  { key: "status", label: "Status", type: "select", options: [...STATUSES], labels: STATUS_LABEL },
  { key: "fee_cents", label: "Fee owed", type: "money", hint: "0 if they didn't have to pay" },
  { key: "method", label: "Payment method", type: "select", options: ["", ...METHODS], labels: METHOD_LABELS },
  { key: "paid_cents", label: "Amount paid", type: "money" },
  { key: "note", label: "Note", type: "textarea" }
];

function Fighters({ t, rows, canEdit, reload, onExport }: { t: Tournament; rows: TournamentFighter[]; canEdit: boolean; reload: () => Promise<void>; onExport: () => void }) {
  const store = useStore();
  const run = useAction();
  const toast = useToast();
  const [editing, setEditing] = useState<TournamentFighter | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | TournamentFighter["status"]>("all");
  const [q, setQ] = useState("");
  const shown = rows.filter(f => (filter === "all" || f.status === filter) && (!q || `${f.name} ${f.club || ""} ${f.divisions || ""}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.name.localeCompare(b.name));
  const count = (st: TournamentFighter["status"]) => rows.filter(f => f.status === st).length;

  async function matchSquare() {
    const payments = await store.list("square_payments");
    const matches = registrationMatches(t, rows, payments);
    if (!matches.length) return void toast("No Square registrations matched a fighter on the list by name.");
    if (!confirm(`Mark ${matches.length} paid by card through Square?\n\n${matches.map(m => m.fighter.name).join("\n")}`)) return;
    if (await run(async () => { for (const m of matches) await store.update("tournament_fighters", m.fighter.id, m.patch); }, `${matches.length} fighters ticked off from Square`)) await reload();
  }

  return (
    <Section title={`Fighters (${rows.length})`} actions={<>
      <button onClick={onExport}>Export</button>
      {canEdit && <button onClick={matchSquare}>Match Square registrations</button>}
      {canEdit && <button className="primary" onClick={() => setEditing("new")}>Add fighter</button>}
    </>}>
      <div className="toolbar">
        <input type="search" placeholder="Search fighters" value={q} onChange={e => setQ(e.target.value)} aria-label="Search fighters" />
        <div className="segmented" role="radiogroup" aria-label="Show">
          <button role="radio" aria-checked={filter === "all"} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
          {STATUSES.map(st => <button key={st} role="radio" aria-checked={filter === st} aria-pressed={filter === st} onClick={() => setFilter(st)}>{STATUS_LABEL[st]} {count(st)}</button>)}
        </div>
      </div>
      {shown.length === 0 ? <Empty>No fighters{filter !== "all" ? ` marked ${STATUS_LABEL[filter].toLowerCase()}` : ""}.</Empty> : (
        <div className="table-wrap short tall">
          <table>
            <thead><tr><th>Name</th><th>Club</th><th>Divisions</th><th>Status</th><th>Method</th><th className="num">Owed</th><th className="num">Paid</th>{canEdit && <th aria-label="Actions" />}</tr></thead>
            <tbody>
              {shown.map(f => (
                <tr key={f.id} className={`st-${f.status}`}>
                  <td data-label="Name">{f.name}{f.note && <small className="muted block">{f.note}</small>}</td>
                  <td data-label="Club">{f.club || <span className="muted">-</span>}</td>
                  <td data-label="Divisions">{f.divisions || <span className="muted">-</span>}</td>
                  <td data-label="Status"><Pill tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</Pill>{f.square_payment_id && <> <Pill tone="later">Square</Pill></>}</td>
                  <td data-label="Method">{methodLabel(f.method)}</td>
                  <td data-label="Owed" className="num"><Money cents={f.fee_cents} /></td>
                  <td data-label="Paid" className="num"><Money cents={f.paid_cents} /></td>
                  {canEdit && <td className="row-actions"><button className="ghost" onClick={() => setEditing(f)}>Edit</button></td>}
                </tr>))}
            </tbody>
          </table>
        </div>)}
      {editing && (
        <Modal title={editing === "new" ? "Add fighter" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <RecordForm fields={FIGHTER_FIELDS}
            initial={(editing === "new" ? { status: "owes", fee_cents: t.fighter_fee_cents, paid_cents: 0, method: "etransfer" } : editing) as Record<string, unknown>}
            onSubmit={async v => {
              const row = { ...v, fee_cents: (v.fee_cents as number | null) ?? 0, paid_cents: (v.paid_cents as number | null) ?? 0 } as Partial<TournamentFighter>;
              const ok = await run(() => editing === "new" ? store.insert("tournament_fighters", { ...row, tournament_id: t.id }) : store.update("tournament_fighters", editing.id, row), "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing === "new" ? undefined : async () => {
              if (!confirm(`Remove ${editing.name}?`)) return;
              if (await run(() => store.remove("tournament_fighters", editing.id), "Removed")) { setEditing(null); await reload(); }
            }} />
        </Modal>)}
    </Section>
  );
}

// ------------------------------------------------------------------ sales

function Sales({ t, rows, canEdit, reload, onExport }: { t: Tournament; rows: TournamentSale[]; canEdit: boolean; reload: () => Promise<void>; onExport: () => void }) {
  const store = useStore();
  const run = useAction();
  const toast = useToast();
  const items = useTable("square_items");
  const [editing, setEditing] = useState<TournamentSale | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const shown = [...rows].sort((a, b) => (a.sold_on || "").localeCompare(b.sold_on || "") || a.item.localeCompare(b.item));

  async function fromSquare() {
    const payments = await store.list("square_payments");
    const lines = squareSaleLines(t, payments as SquarePaymentRow[], rows, items.rows || []);
    if (!lines.length) return void toast(t.starts_on ? "No new Square sales in the app for these days. If Square wasn't connected yet, use Import a Square export." : "Add the edition's dates first.");
    const total = sum(lines, l => l.quantity * l.price_cents);
    if (!confirm(`Add ${lines.length} sale lines (${formatMoney(total)}) from Square sales for ${t.code}? Registrations and dues are left out.`)) return;
    if (await run(() => store.insertMany("tournament_sales", lines), `Added ${lines.length} Square sales`)) await reload();
  }

  return (
    <Section title={`Sales (${formatMoney(sum(rows, s => s.quantity * s.price_cents))})`} actions={<>
      <button onClick={onExport}>Export</button>
      {canEdit && <button onClick={fromSquare}>Add from Square sales</button>}
      {canEdit && <button onClick={() => setImporting(true)}>Import a Square export</button>}
      {canEdit && <button className="primary" onClick={() => setEditing("new")}>Add sale</button>}
    </>}>
      {shown.length === 0 ? <Empty>No sales yet. Pull them in from Square, or add cash sales by hand.</Empty> : (
        <div className="table-wrap short tall">
          <table>
            <thead><tr><th>Day</th><th>Item</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Total</th><th>Method</th>{canEdit && <th aria-label="Actions" />}</tr></thead>
            <tbody>
              {shown.map(s => (
                <tr key={s.id}>
                  <td data-label="Day">{s.sold_on ? dateLabel(s.sold_on) : <span className="muted">-</span>}</td>
                  <td data-label="Item">{s.item}
                    <div className="tags">
                      {s.square_payment_id && <Link className="pill later" to="/sales">Square sales</Link>}
                      {s.square_ref && <Pill tone="later">Square export</Pill>}
                      {s.square_item_id && <Pill>Square item</Pill>}
                    </div>
                    {s.note && s.note !== "From a Square export" && <small className="muted block">{s.note}</small>}</td>
                  <td data-label="Qty" className="num">{s.quantity}</td>
                  <td data-label="Price" className="num">{s.price_cents === 0 ? <span className="free-text">Free</span> : <Money cents={s.price_cents} />}</td>
                  <td data-label="Total" className="num"><Money cents={s.quantity * s.price_cents} /></td>
                  <td data-label="Method">{METHOD_LABEL[s.method]}</td>
                  {canEdit && <td className="row-actions"><button className="ghost" onClick={() => setEditing(s)}>Edit</button></td>}
                </tr>))}
            </tbody>
          </table>
        </div>)}
      {editing && (
        <Modal title={editing === "new" ? "Add sale" : "Edit sale"} onClose={() => setEditing(null)}>
          <SaleForm t={t} initial={editing === "new" ? null : editing} squareItems={(items.rows || []).filter(i => i.kind !== "dues")}
            onSave={async row => {
              const ok = await run(() => editing === "new" ? store.insert("tournament_sales", { ...row, tournament_id: t.id }) : store.update("tournament_sales", editing.id, row), "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing === "new" ? undefined : async () => {
              if (!confirm("Delete this sale?")) return;
              if (await run(() => store.remove("tournament_sales", editing.id), "Deleted")) { setEditing(null); await reload(); }
            }} />
        </Modal>)}
      {importing && <SquareExportImport t={t} existing={rows} squareItems={items.rows || []} onClose={() => setImporting(false)} onDone={async () => { setImporting(false); await reload(); }} />}
    </Section>
  );
}

function SaleForm({ t, initial, squareItems, onSave, onDelete }: {
  t: Tournament; initial: TournamentSale | null; squareItems: { id: string; title: string; price_cents: number }[];
  onSave: (row: Partial<TournamentSale>) => Promise<void>; onDelete?: () => void;
}) {
  const choices = useMemo(() => {
    const list = PRICE_LIST.filter(p => p.kind !== "dues").map(p => ({ title: p.title, price_cents: p.price_cents }));
    for (const i of squareItems) if (!list.some(l => l.title.toLowerCase() === i.title.toLowerCase())) list.push({ title: i.title, price_cents: i.price_cents });
    return list;
  }, [squareItems]);
  const known = (title: string) => choices.find(c => c.title.toLowerCase() === title.toLowerCase());
  const [item, setItem] = useState(initial?.item ?? choices[0]?.title ?? "");
  const [other, setOther] = useState(initial && !known(initial.item) ? initial.item : "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [price, setPrice] = useState(((initial?.price_cents ?? known(item)?.price_cents ?? 0) / 100).toFixed(2));
  const [method, setMethod] = useState<Method>(initial?.method ?? "cash");
  const [day, setDay] = useState(initial?.sold_on ?? t.starts_on ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const isOther = !known(item) || item === "__other";
  return (
    <form className="form" onSubmit={async e => {
      e.preventDefault();
      const name = isOther ? other.trim() : item;
      const cents = parseMoney(price);
      if (!name) return setError("Name the item");
      if (cents === null || cents < 0) return setError("Price: enter an amount like 10.00");
      if (!/^\d+$/.test(quantity)) return setError("Quantity: a whole number");
      if (saleKind(name) === "dues") return setError("Monthly dues are club dues, not tournament money. Record them on the Dues page.");
      const sq = squareItems.find(i => i.title.toLowerCase() === name.toLowerCase());
      await onSave({ item: name, quantity: Number(quantity), price_cents: cents, method, sold_on: day || null, note: note.trim() || null, square_item_id: sq?.id ?? initial?.square_item_id ?? null });
    }}>
      <div className="grid">
        <label><span>Item</span>
          <select value={isOther ? "__other" : item} onChange={e => { setItem(e.target.value); const k = known(e.target.value); if (k) setPrice((k.price_cents / 100).toFixed(2)); }}>
            {choices.map(c => <option key={c.title} value={c.title}>{c.title} · {c.price_cents ? formatMoney(c.price_cents) : "free"}</option>)}
            <option value="__other">Something else…</option>
          </select></label>
        {isOther && <label><span>What was sold</span><input value={other} onChange={e => setOther(e.target.value)} required /></label>}
        <label><span>Quantity</span><input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
        <label><span>Price each</span><input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} /></label>
        <label><span>Payment method</span><select value={method} onChange={e => setMethod(e.target.value as Method)}>{METHODS.map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select></label>
        <label><span>Day</span><input type="date" value={day} onChange={e => setDay(e.target.value)} /></label>
        <label className="wide"><span>Note</span><input value={note} onChange={e => setNote(e.target.value)} /></label>
      </div>
      <p className="muted">Total {formatMoney((parseMoney(price) ?? 0) * (Number(quantity) || 0))}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
        <button type="submit" className="primary">Save</button>
      </div>
    </form>
  );
}

function SquareExportImport({ t, existing, squareItems, onClose, onDone }: { t: Tournament; existing: TournamentSale[]; squareItems: { id: string; title: string }[]; onClose: () => void; onDone: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [result, setResult] = useState<ReturnType<typeof squareCsvLines> | null>(null);
  const [names, setNames] = useState<string[]>([]);
  return (
    <Modal title="Import a Square export" onClose={onClose}>
      <p>In the Square Dashboard, go to <b>Reports → Item sales</b> (or <b>Transactions</b>), pick {t.starts_on ? `${dateLabel(t.starts_on)}${t.ends_on && t.ends_on !== t.starts_on ? ` to ${dateLabel(t.ends_on)}` : ""}` : "the event days"}, and use <b>Export → Item details CSV</b>. Pick the Transactions CSV too, and each sale gets its cash or card from it. Lines already imported are skipped.</p>
      <input type="file" accept=".csv,text/csv" multiple onChange={async e => {
        const files = [...(e.target.files || [])];
        setNames(files.map(f => f.name));
        const tables = await Promise.all(files.map(async f => parseCsv(await f.text())));
        setResult(squareCsvLines(t, tables, existing, squareItems));
      }} />
      {result && (result.kind === "none" ? <p className="error">These don't look like Square's Item details or Transactions exports ({names.join(", ")}).</p> : (
        <>
          <p><b>{result.lines.length} sale lines</b>, {formatMoney(sum(result.lines, l => l.quantity * l.price_cents))}: {METHODS.map(m => [m, sum(result.lines.filter(l => l.method === m), l => l.quantity * l.price_cents)] as const).filter(([, c]) => c).map(([m, c]) => `${METHOD_LABEL[m]} ${formatMoney(c)}`).join(" · ") || "nothing new"}.</p>
          <p className="muted small">Left out: {result.skipped.registrations} registrations (tick those fighters off instead), {result.skipped.dues} dues, {result.skipped.refunds} refunds, {result.skipped.outside} outside the event days, {result.skipped.already} already imported.{result.kind === "items" && !result.lines.some(l => l.method !== "cash") && " Without the Transactions CSV everything is counted as cash."}</p>
          {result.lines.length > 0 && (
            <div className="table-wrap short">
              <table><tbody>{result.lines.slice(0, 200).map((l, i) => <tr key={i}><td>{l.sold_on}</td><td>{l.item}</td><td className="num">{l.quantity}</td><td className="num"><Money cents={l.quantity * l.price_cents} /></td><td>{METHOD_LABEL[l.method]}</td></tr>)}</tbody></table>
            </div>)}
          <div className="form-actions">
            <button className="primary" disabled={!result.lines.length} onClick={async () => { if (await run(() => store.insertMany("tournament_sales", result.lines), `Imported ${result.lines.length} lines`)) await onDone(); }}>Import {result.lines.length} lines</button>
          </div>
        </>))}
    </Modal>
  );
}

// ------------------------------------------------------------------ expenses

const EXPENSE_FIELDS: Field[] = [
  { key: "category", label: "Category", type: "select", options: [...EXPENSE_CATEGORIES], labels: EXPENSE_LABEL },
  { key: "amount_cents", label: "Amount", type: "money", required: true },
  { key: "method", label: "Payment method", type: "select", options: [...METHODS], labels: METHOD_LABEL },
  { key: "spent_on", label: "Day", type: "date" },
  { key: "description", label: "What for", wide: true },
  { key: "from_cash_box", label: "Paid out of the event's cash box", type: "checkbox" },
  { key: "out_of_pocket", label: "Someone covered it out of pocket and won't be paid back", type: "checkbox" },
  { key: "covered_by", label: "Covered by", hint: "Who paid for it, if it was covered out of pocket" }
];
/** The two out-of-pocket columns are only sent when they're used or already there, so saving still works before that migration is applied. */
const expenseRow = (v: Record<string, unknown>, before?: TournamentExpense): Partial<TournamentExpense> => {
  const out = Boolean(v.out_of_pocket);
  const { out_of_pocket: _o, covered_by: _c, ...rest } = v;
  const row = { ...rest, from_cash_box: out ? false : Boolean(v.from_cash_box) } as Partial<TournamentExpense>;
  if (out || (before && "out_of_pocket" in before)) Object.assign(row, { out_of_pocket: out, covered_by: out ? String(v.covered_by || "").trim() || null : null });
  return row;
};

function Expenses({ t, rows, canEdit, reload, onExport }: { t: Tournament; rows: TournamentExpense[]; canEdit: boolean; reload: () => Promise<void>; onExport: () => void }) {
  const store = useStore();
  const run = useAction();
  const [editing, setEditing] = useState<TournamentExpense | "new" | null>(null);
  return (
    <Section title={`Expenses (${formatMoney(sum(rows.filter(clubPaid), e => e.amount_cents))}${rows.some(e => !clubPaid(e)) ? `, plus ${formatMoney(sum(rows.filter(e => !clubPaid(e)), e => e.amount_cents))} covered out of pocket` : ""})`} actions={<>
      <button onClick={onExport}>Export</button>
      {canEdit && <button className="primary" onClick={() => setEditing("new")}>Add expense</button>}
    </>}>
      {rows.length === 0 ? <Empty>No expenses yet.</Empty> : (<>
        <ExpenseBars rows={rows} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>What for</th><th>Method</th><th className="num">Amount</th>{canEdit && <th aria-label="Actions" />}</tr></thead>
            <tbody>
              {[...rows].sort((a, b) => EXPENSE_CATEGORIES.indexOf(a.category) - EXPENSE_CATEGORIES.indexOf(b.category)).map(e => (
                <tr key={e.id}>
                  <td data-label="Category">{EXPENSE_LABEL[e.category]}</td>
                  <td data-label="What for">{e.description || <span className="muted">-</span>}{e.from_cash_box && <> <Pill>from cash box</Pill></>}{e.out_of_pocket && <> <Pill tone="gift">{e.covered_by ? `Covered by ${e.covered_by}` : "Covered out of pocket"}</Pill></>}</td>
                  <td data-label="Method">{METHOD_LABEL[e.method]}</td>
                  <td data-label="Amount" className="num">{e.out_of_pocket ? <span className="money gift" title="Not a club cost">{formatMoney(e.amount_cents)}</span> : <Money cents={e.amount_cents} />}</td>
                  {canEdit && <td className="row-actions"><button className="ghost" onClick={() => setEditing(e)}>Edit</button></td>}
                </tr>))}
            </tbody>
          </table>
        </div></>)}
      {editing && (
        <Modal title={editing === "new" ? "Add expense" : "Edit expense"} onClose={() => setEditing(null)}>
          <RecordForm fields={EXPENSE_FIELDS} initial={(editing === "new" ? { method: "etransfer", spent_on: t.starts_on } : editing) as Record<string, unknown>}
            onSubmit={async v => {
              const ok = await run(() => editing === "new" ? store.insert("tournament_expenses", { ...expenseRow(v), tournament_id: t.id }) : store.update("tournament_expenses", editing.id, expenseRow(v, editing)), "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing === "new" ? undefined : async () => {
              if (!confirm("Delete this expense?")) return;
              if (await run(() => store.remove("tournament_expenses", editing.id), "Deleted")) { setEditing(null); await reload(); }
            }} />
        </Modal>)}
    </Section>
  );
}

function ExpenseBars({ rows }: { rows: TournamentExpense[] }) {
  const cats = EXPENSE_CATEGORIES.map(c => ({ c, cents: sum(rows.filter(e => e.category === c && clubPaid(e)), e => e.amount_cents) })).filter(x => x.cents).sort((a, b) => b.cents - a.cents);
  const donated = sum(rows.filter(e => !clubPaid(e)), e => e.amount_cents);
  const top = Math.max(cats[0]?.cents || 0, donated);
  return (
    <ul className="tour-bars" aria-label="Expenses by category">
      {cats.map(x => <li key={x.c}><span>{EXPENSE_LABEL[x.c]}</span><span className="bar"><span style={{ width: `${pct(x.cents, top)}%` }} /></span><Money cents={x.cents} /></li>)}
      {donated > 0 && <li className="gift"><span>Out of pocket</span><span className="bar"><span style={{ width: `${pct(donated, top)}%` }} /></span><span>{formatMoney(donated)}</span></li>}
    </ul>
  );
}

// ------------------------------------------------------------------ cash boxes

function CashBoxes({ t, rows, summary, canEdit, reload, onExport }: { t: Tournament; rows: CashBox[]; summary: Summary; canEdit: boolean; reload: () => Promise<void>; onExport: () => void }) {
  const store = useStore();
  const run = useAction();
  const [editing, setEditing] = useState<CashBox | "new" | null>(null);
  const c = summary.cash;
  return (
    <Section title="Cash boxes" actions={<>
      <button onClick={onExport}>Export</button>
      {canEdit && <button className="primary" onClick={() => setEditing("new")}>Add cash box</button>}
    </>}>
      <div className="stats">
        <div className="stat"><span>Expected cash</span><strong><Money cents={c.expected} /></strong><small>cash sales and cash fighter fees, less expenses paid from the box</small></div>
        <div className="stat"><span>Cash taken</span><strong>{c.counted ? <Money cents={c.taken} /> : <span className="muted">Not counted</span>}</strong><small>closing <Money cents={c.closing} /> − opening <Money cents={c.opening} /></small></div>
        <div className={`stat ${c.counted ? (c.overShort < 0 ? "bad" : "good") : ""}`}><span>Over or short</span>{c.counted ? <OverShort cents={c.overShort} /> : <strong className="muted">Waiting on the count</strong>}</div>
      </div>
      {rows.length === 0 ? <Empty>No cash boxes yet. Add one for each box (door, merch table) and count the float and the closing cash.</Empty> : (
        <div className="cards two box-cards">
          {rows.map(b => {
            const plan = floatPlan(b.closing, b.opening, b.keep_float_cents);
            const open = countTotal(b.opening), close = countTotal(b.closing);
            return (
              <article key={b.id} className={`card tour-box ${b.counted ? "counted" : "waiting"}`}>
                <header className="tour-head"><h2>{b.name} {b.counted ? <Pill tone="done">Counted</Pill> : <Pill>Not counted</Pill>}</h2>{canEdit && <button className="ghost" onClick={() => setEditing(b)}>Count</button>}</header>
                <div className="table-wrap">
                  <table className="count-table">
                    <thead><tr><th></th><th className="num">Float</th><th className="num">Closing</th><th className="num">Keep</th><th className="num">Deposit</th></tr></thead>
                    <tbody>
                      {DENOMS.map(d => (
                        <tr key={d}><td>{denomLabel(d)}</td><td className="num">{b.opening[String(d)] || ""}</td><td className="num">{b.closing[String(d)] || ""}</td>
                          <td className="num">{b.counted ? plan.keep[String(d)] || "" : ""}</td><td className="num">{b.counted ? plan.deposit[String(d)] || "" : ""}</td></tr>))}
                      <tr className="total"><td>Total</td><td className="num"><Money cents={open} /></td><td className="num">{b.counted ? <Money cents={close} /> : <span className="muted">-</span>}</td>
                        <td className="num">{b.counted ? <Money cents={plan.keepCents} /> : ""}</td><td className="num">{b.counted ? <Money cents={plan.depositCents} /> : ""}</td></tr>
                    </tbody>
                  </table>
                </div>
                {b.counted ? <p>Cash taken <b><Money cents={close - open} /></b>. Keep <b><Money cents={plan.keepCents} /></b> for next time's float and deposit <b><Money cents={plan.depositCents} /></b>.
                  {plan.shortBy > 0 && <span className="money short"> The box can't make a {formatMoney(plan.target)} float exactly ({formatMoney(plan.shortBy)} short in change).</span>}</p>
                  : <p className="muted">Not counted yet.</p>}
                {(b.counted_by || b.note) && <p className="muted small">{[b.counted_by && `Counted by ${b.counted_by}`, b.note].filter(Boolean).join(" · ")}</p>}
              </article>);
          })}
        </div>)}
      {editing && <CashBoxForm t={t} initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={async row => {
        const ok = await run(() => editing === "new" ? store.insert("tournament_cash_boxes", { ...row, tournament_id: t.id }) : store.update("tournament_cash_boxes", editing.id, row), "Saved");
        if (ok) { setEditing(null); await reload(); }
      }} onDelete={editing === "new" ? undefined : async () => {
        if (!confirm(`Delete the ${editing.name} box?`)) return;
        if (await run(() => store.remove("tournament_cash_boxes", editing.id), "Deleted")) { setEditing(null); await reload(); }
      }} />}
    </Section>
  );
}

function CashBoxForm({ initial, onClose, onSave, onDelete }: { t: Tournament; initial: CashBox | null; onClose: () => void; onSave: (row: Partial<CashBox>) => Promise<void>; onDelete?: () => void }) {
  const [name, setName] = useState(initial?.name ?? "Door");
  const [opening, setOpening] = useState<Counts>(initial?.opening ?? {});
  const [closing, setClosing] = useState<Counts>(initial?.closing ?? {});
  const [counted, setCounted] = useState(initial?.counted ?? false);
  const [keep, setKeep] = useState(initial?.keep_float_cents === null || initial?.keep_float_cents === undefined ? "" : (initial.keep_float_cents / 100).toFixed(2));
  const [by, setBy] = useState(initial?.counted_by ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const set = (which: "o" | "c", d: number, v: string) => {
    const n = v === "" ? undefined : Math.max(0, Math.floor(Number(v)) || 0);
    (which === "o" ? setOpening : setClosing)(prev => { const next = { ...prev }; if (n) next[String(d)] = n; else delete next[String(d)]; return next; });
    if (which === "c") setCounted(true);
  };
  return (
    <Modal title={initial ? `Count the ${initial.name} box` : "Add cash box"} onClose={onClose}>
      <form className="form" onSubmit={async e => {
        e.preventDefault();
        const k = keep.trim() ? parseMoney(keep) : null;
        if (keep.trim() && (k === null || k < 0)) return setError("Float for next time: enter an amount like 150.00");
        if (!name.trim()) return setError("Name the box");
        await onSave({ name: name.trim(), opening, closing, counted, keep_float_cents: k, counted_by: by.trim() || null, note: note.trim() || null });
      }}>
        <div className="grid">
          <label><span>Box</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Door, Merch table" required /></label>
          <label><span>Float to keep for next time</span><input inputMode="decimal" value={keep} onChange={e => setKeep(e.target.value)} placeholder={`Same as this time (${formatMoney(countTotal(opening))})`} /></label>
          <label><span>Counted by</span><input value={by} onChange={e => setBy(e.target.value)} /></label>
        </div>
        <div className="table-wrap">
          <table className="count-table">
            <thead><tr><th>Note or coin</th><th>Opening float (how many)</th><th>Closing count (how many)</th></tr></thead>
            <tbody>
              {DENOMS.map(d => (
                <tr key={d}>
                  <td>{denomLabel(d)}</td>
                  <td><input type="number" min="0" inputMode="numeric" aria-label={`Opening ${denomLabel(d)}`} value={opening[String(d)] ?? ""} onChange={e => set("o", d, e.target.value)} /></td>
                  <td><input type="number" min="0" inputMode="numeric" aria-label={`Closing ${denomLabel(d)}`} value={closing[String(d)] ?? ""} onChange={e => set("c", d, e.target.value)} /></td>
                </tr>))}
              <tr className="total"><td>Total</td><td className="num"><Money cents={countTotal(opening)} /></td><td className="num"><Money cents={countTotal(closing)} /></td></tr>
            </tbody>
          </table>
        </div>
        <label className="check"><input type="checkbox" checked={counted} onChange={e => setCounted(e.target.checked)} /> The closing count is done</label>
        <label><span>Note</span><input value={note} onChange={e => setNote(e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
          <button type="submit" className="primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ stats

function Stats({ t, data, onExport }: { t: Tournament; data: Data; onExport: () => void }) {
  const clubs = [...new Set(data.fighters.map(f => f.club?.trim()).filter(Boolean))];
  const board: [string, ReactNode][] = [
    ["Fighters", t.fighters_count ?? data.fighters.length], ["Divisions", t.divisions ?? "-"], ["Fights", t.fights ?? "-"], ["Rounds", t.rounds ?? "-"],
    ["Clubs", t.clubs_attending ?? (clubs.length || "-")]
  ];
  const days = t.spectators || [];
  const most = Math.max(0, ...days.map(d => d.count));
  return (
    <Section title="Stats" actions={<button onClick={onExport}>Export</button>}>
      <dl className="tour-board">{board.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className="tour-crowd">
        <div className="card">
          <h3>Spectators <b>{visitors(t)}</b></h3>
          {days.length ? <ul className="tour-bars">{days.map(d => <li key={d.day}><span>{d.day}</span><span className="bar"><span style={{ width: `${pct(d.count, most)}%` }} /></span><b>{d.count}</b></li>)}</ul> : <p className="muted">Not recorded.</p>}
        </div>
        <div className="card">
          <h3>Stream</h3>
          <dl className="tour-stream"><div><dt>Viewers</dt><dd>{t.stream_viewers ?? "-"}</dd></div><div><dt>Time live</dt><dd>{formatMinutes(t.stream_minutes) || "-"}</dd></div></dl>
        </div>
      </div>
      {(t.podiums || []).length > 0 && (
        <div className="table-wrap">
          <table className="podiums">
            <thead><tr><th>Division</th><th className="gold">First</th><th className="silver">Second</th><th className="bronze">Third</th></tr></thead>
            <tbody>{t.podiums.map((p, i) => <tr key={i}><td data-label="Division">{p.division}</td><td data-label="First" className="gold">{p.first}</td><td data-label="Second" className="silver">{p.second}</td><td data-label="Third" className="bronze">{p.third}</td></tr>)}</tbody>
          </table>
        </div>)}
      {t.notes && <p className="muted">{t.notes}</p>}
    </Section>
  );
}

// ------------------------------------------------------------------ edition form

const spectatorsText = (s: Tournament["spectators"]) => (s || []).map(d => `${d.day}: ${d.count}`).join("\n");
const podiumsText = (p: Tournament["podiums"]) => (p || []).map(x => `${x.division}: ${[x.first, x.second, x.third].filter(Boolean).join(", ")}`).join("\n");
const EDITION_FIELDS: Field[] = [
  { key: "name", label: "Event", required: true, hint: "The same name every year, e.g. Red Deer Rumble" },
  { key: "year", label: "Year", type: "number", required: true },
  { key: "code", label: "Short ID", hint: "Left blank, it's made from the name and year (RUMBLE-2026)" },
  { key: "starts_on", label: "First day", type: "date" },
  { key: "ends_on", label: "Last day", type: "date" },
  { key: "venue", label: "Venue" },
  { key: "fighter_fee_cents", label: "Fighter fee", type: "money", required: true },
  { key: "fighters_count", label: "Fighters", type: "number", hint: "Blank counts the fighter list" },
  { key: "divisions", label: "Divisions", type: "number" },
  { key: "fights", label: "Fights", type: "number" },
  { key: "rounds", label: "Rounds", type: "number" },
  { key: "clubs_attending", label: "Clubs attending", type: "number" },
  { key: "stream_viewers", label: "Stream viewers (unique)", type: "number" },
  { key: "stream_time", label: "Stream time", hint: "e.g. 21h 50m" },
  { key: "spectators_text", label: "Spectators per day", type: "textarea", hint: "One day per line: Saturday: 52" },
  { key: "podiums_text", label: "Podiums", type: "textarea", hint: "One division per line: Men's longsword: first, second, third", wide: true },
  { key: "notes", label: "Notes", type: "textarea", wide: true }
];

function EditionForm({ initial, onSave, onDelete }: { initial: Tournament | null; onSave: (row: Partial<Tournament>) => Promise<void>; onDelete?: () => void }) {
  const [error, setError] = useState("");
  const start = initial
    ? { ...initial, stream_time: formatMinutes(initial.stream_minutes), spectators_text: spectatorsText(initial.spectators), podiums_text: podiumsText(initial.podiums) }
    : { name: "Red Deer Rumble", year: new Date().getFullYear(), fighter_fee_cents: 4000, spectators_text: "Saturday: \nSunday: " };
  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <RecordForm fields={EDITION_FIELDS} initial={start as unknown as Record<string, unknown>} submitLabel={initial ? "Save" : "Add edition"} onDelete={onDelete}
        onSubmit={async v => {
          const name = String(v.name), year = Number(v.year);
          const code = String(v.code || editionCode(name, year)).toUpperCase().replace(/[^A-Z0-9-]/g, "-");
          const minutes = v.stream_time ? parseMinutes(String(v.stream_time)) : null;
          if (v.stream_time && minutes === null) return setError("Stream time: write it like 21h 50m");
          const spectators = String(v.spectators_text || "").split("\n").map(l => l.match(/^\s*(.+?)\s*[:=-]\s*(\d+)\s*$/)).filter(Boolean).map(m => ({ day: m![1], count: Number(m![2]) }));
          const podiums = String(v.podiums_text || "").split("\n").map(l => l.match(/^\s*(.+?)\s*:\s*(.*)$/)).filter(Boolean).map(m => {
            const [first, second, third] = m![2].split(",").map(s => s.trim());
            return { division: m![1], first: first || undefined, second: second || undefined, third: third || undefined };
          });
          setError("");
          await onSave({
            name, year, code, starts_on: (v.starts_on as string) || null, ends_on: (v.ends_on as string) || null, venue: (v.venue as string) || null,
            fighter_fee_cents: (v.fighter_fee_cents as number) ?? 0, fighters_count: v.fighters_count as number | null, divisions: v.divisions as number | null,
            fights: v.fights as number | null, rounds: v.rounds as number | null, clubs_attending: v.clubs_attending as number | null,
            stream_viewers: v.stream_viewers as number | null, stream_minutes: minutes, spectators, podiums, notes: (v.notes as string) || null
          });
        }} />
    </>
  );
}

// ------------------------------------------------------------------ all tournaments

/** One column per edition, net above or below the line. */
function NetByYear({ rows, onPick }: { rows: { t: Tournament; s: Summary }[]; onPick: (id: string) => void }) {
  const top = Math.max(1, ...rows.map(r => Math.abs(r.s.net)));
  return (
    <div className="tour-years" aria-label="Net by year">
      {rows.map(r => (
        <button key={r.t.id} className="tour-year" onClick={() => onPick(r.t.id)} title={`${r.t.code}: net ${formatMoney(r.s.net)}`}>
          <span className={`money ${r.s.net < 0 ? "short" : "in"}`}>{formatMoney(r.s.net)}</span>
          <span className="col"><span className={r.s.net < 0 ? "neg" : "pos"} style={{ height: `${Math.max(4, pct(Math.abs(r.s.net), top))}%` }} /></span>
          <b>{r.t.year}</b>
        </button>))}
    </div>
  );
}

function AllTournaments({ rows, onPick }: { rows: { t: Tournament; s: Summary; d: Data }[]; onPick: (id: string) => void }) {
  const groups = byEvent(rows.map(r => ({ ...r, name: r.t.name, year: r.t.year })));
  const Delta = ({ now, before, money }: { now: number; before?: number | null; money?: boolean }) => {
    const d = change(now, before);
    if (d === null) return null;
    return <small className={d < 0 ? "delta down" : d > 0 ? "delta up" : "delta"}>{d > 0 ? "▲" : d < 0 ? "▼" : "="} {money ? formatMoney(Math.abs(d)) : Math.abs(d)}</small>;
  };
  return (
    <>
      <div className="toolbar"><button onClick={() => xlsx("reavers-tournaments-compare", [overviewSheet(rows, todayIso())], "Reavers tournaments")}>Export comparison</button></div>
      {groups.map(g => (
        <Section key={g.name} title={g.name}>
          <NetByYear rows={g.editions} onPick={onPick} />
          <div className="table-wrap">
            <table className="compare">
              <thead><tr><th>Edition</th><th className="num">Fighters</th><th className="num">Fights</th><th className="num">Spectators</th><th className="num">Stream</th><th className="num">Fees in</th><th className="num">Owing</th><th className="num">Sales</th><th className="num">Total in</th><th className="num">Total out</th><th className="num">Net</th></tr></thead>
              <tbody>
                {g.editions.map((r, i) => {
                  const p = i ? g.editions[i - 1] : null;
                  const fighters = (x: typeof r) => x.t.fighters_count ?? x.d.fighters.length;
                  return (
                    <tr key={r.t.id}>
                      <td data-label="Edition"><button className="ghost link" onClick={() => onPick(r.t.id)}>{r.t.code}</button><small className="muted block">{[r.t.starts_on && dateLabel(r.t.starts_on), r.t.venue].filter(Boolean).join(" · ")}</small></td>
                      <td data-label="Fighters" className="num">{fighters(r)} <Delta now={fighters(r)} before={p && fighters(p)} /></td>
                      <td data-label="Fights" className="num">{r.t.fights ?? "-"} {r.t.fights !== null && <Delta now={r.t.fights} before={p?.t.fights} />}</td>
                      <td data-label="Spectators" className="num">{visitors(r.t)} <Delta now={visitors(r.t)} before={p && visitors(p.t)} /></td>
                      <td data-label="Stream" className="num">{r.t.stream_viewers ?? "-"} {r.t.stream_viewers !== null && <Delta now={r.t.stream_viewers} before={p?.t.stream_viewers} />}</td>
                      <td data-label="Fees in" className="num"><Money cents={r.s.fees.collected} /> <Delta now={r.s.fees.collected} before={p?.s.fees.collected} money /></td>
                      <td data-label="Owing" className="num"><span className={r.s.fees.owing ? "money short" : "money"}>{formatMoney(r.s.fees.owing)}</span></td>
                      <td data-label="Sales" className="num"><Money cents={r.s.sales.total} /> <Delta now={r.s.sales.total} before={p?.s.sales.total} money /></td>
                      <td data-label="Total in" className="num"><Money cents={r.s.totalIn} /></td>
                      <td data-label="Total out" className="num"><Money cents={r.s.totalOut} /></td>
                      <td data-label="Net" className="num"><span className={r.s.net < 0 ? "money short" : "money in"}>{formatMoney(r.s.net)}</span> <Delta now={r.s.net} before={p?.s.net} money /></td>
                    </tr>);
                })}
              </tbody>
            </table>
          </div>
        </Section>))}
    </>
  );
}

import { useState } from "react";
import { CATEGORIES } from "../data/categories";
import { budgetActuals } from "../lib/budget";
import { Empty, Loading, Money, Page, RecordList, usePage, useTable } from "../ui";

export function Budgets() {
  const budgets = useTable("budgets");
  const tx = useTable("transactions");
  const canEdit = usePage("budget") === 2;
  const [year, setYear] = useState(new Date().getFullYear());
  const rows = budgets.rows && tx.rows ? budgetActuals(budgets.rows, tx.rows, year) : null;
  const years = [...new Set([year, new Date().getFullYear(), ...(budgets.rows || []).map(b => b.year)])].sort();
  return (
    <Page title="Budget" intro="Set what the club plans to raise and spend per category; actuals come straight from the ledger."
      actions={<select value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Year">{years.map(y => <option key={y}>{y}</option>)}</select>}>
      {!rows ? <Loading /> : rows.length === 0 ? <Empty>No budget for {year} yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Kind</th><th className="num">Budget</th><th className="num">Actual</th><th>Used</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.category}>
                  <td data-label="Category">{r.category}</td><td data-label="Kind">{r.kind}</td>
                  <td data-label="Budget" className="num"><Money cents={r.budget_cents} /></td>
                  <td data-label="Actual" className="num"><Money cents={r.actual_cents} /></td>
                  <td data-label="Used"><div className="bar" title={`${r.percent}%`}><span className={r.kind === "expense" && r.percent > 100 ? "over" : ""} style={{ width: `${Math.min(r.percent, 100)}%` }} /></div><small>{r.percent}%</small></td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
      {canEdit && (
        <details className="manage">
          <summary>Edit budget lines</summary>
          <RecordList table="budgets" noun="budget line" rows={budgets.rows} reload={budgets.reload} defaults={{ year }}
            fields={[
              { key: "year", label: "Year", type: "number", required: true },
              { key: "category", label: "Category", type: "select", options: CATEGORIES },
              { key: "kind", label: "Kind", type: "select", options: ["expense", "income"] },
              { key: "amount_cents", label: "Amount", type: "money", required: true }
            ]}
            columns={[{ label: "Year", render: b => b.year }, { label: "Category", render: b => b.category }, { label: "Kind", render: b => b.kind }, { label: "Amount", render: b => <Money cents={b.amount_cents} />, className: "num" }]} />
        </details>)}
    </Page>
  );
}

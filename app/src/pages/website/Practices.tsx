import { useState } from "react";
import type { SitePractice } from "../../data/website";
import { Empty, Modal, Page, Pill, RecordForm } from "../../ui";
import { CaptainOnly, DAYS, clock, hhmm, useSite } from "./shared";

export function Practices() {
  const { data, failed, act } = useSite();
  const [editing, setEditing] = useState<Partial<SitePractice> | null>(null);
  const next = () => ({ weekday: 0, label: "Sunday", start_time: "17:00", end_time: "20:00", venue: "Springbrook Archery Centre", fee: "$10", active: true, sort_order: ((data?.practices.length || 0) + 1) * 10 });
  return (
    <Page title="Practices" intro="The weekly practices on the Training page, the home page and the calendar. Change a day, time, venue or fee, or hide a practice for a while."
      actions={data?.admin && <button className="primary" onClick={() => setEditing(next())}>Add practice</button>}>
      <CaptainOnly data={data} failed={failed}>{d => {
        const list = [...d.practices].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.weekday - b.weekday);
        return list.length === 0 ? <Empty>No weekly practices set.</Empty> : (
          <ul className="rows card">
            {list.map(p => (
              <li key={p.id} className={p.active ? "" : "dim"}>
                <div>
                  <strong>{p.label} · {clock(p.start_time)} to {clock(p.end_time)}</strong>
                  <small className="muted block">{DAYS[p.weekday]}s · {p.venue}{p.fee && ` · ${p.fee}`}</small>
                  {!p.active && <Pill tone="soon">hidden</Pill>}
                </div>
                <div className="row-actions">
                  <button className="ghost" onClick={() => setEditing(p)}>Edit</button>
                  <button className="ghost" onClick={() => { if (confirm("Delete this practice? This cannot be undone.")) void act({ action: "practice_delete", id: p.id }, "Deleted"); }}>Delete</button>
                </div>
              </li>))}
          </ul>);
      }}</CaptainOnly>
      {editing && (
        <Modal title={editing.id ? "Edit practice" : "Add practice"} onClose={() => setEditing(null)}>
          <RecordForm
            fields={[
              { key: "day", label: "Day", type: "select", options: DAYS },
              { key: "label", label: "Label", hint: "Shown on the website, e.g. Sunday" },
              { key: "start_time", label: "Start time", type: "time", required: true },
              { key: "end_time", label: "End time", type: "time", required: true },
              { key: "venue", label: "Venue", required: true, wide: true },
              { key: "fee", label: "Fee", hint: "e.g. $10" },
              { key: "sort_order", label: "Sort order", type: "number" },
              { key: "active", label: "Practice is on (shown on the website)", type: "checkbox" }
            ]}
            initial={{ ...editing, day: DAYS[Number(editing.weekday) || 0], start_time: hhmm(editing.start_time), end_time: hhmm(editing.end_time) }}
            onSubmit={async ({ day, ...values }) => {
              const weekday = Math.max(0, DAYS.indexOf(String(day)));
              const item = { ...values, id: editing.id, weekday, label: (values.label as string | null) || DAYS[weekday], sort_order: Number(values.sort_order) || 0 } as Partial<SitePractice>;
              if (await act({ action: "practice_save", item }, "Saved")) setEditing(null);
            }}
            onDelete={editing.id ? async () => { if (confirm("Delete this practice? This cannot be undone.") && await act({ action: "practice_delete", id: editing.id! }, "Deleted")) setEditing(null); } : undefined}
          />
        </Modal>)}
    </Page>
  );
}

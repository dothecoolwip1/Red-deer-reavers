import { useState } from "react";
import { Empty, Loading, Modal, Page, Pill, RecordForm, dateLabel, todayIso, useAction, useCan, useStore, useTable, type Field } from "../ui";
import type { Incident } from "../data/types";

const FIELDS: Field[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "person", label: "Who was hurt", required: true },
  { key: "description", label: "What happened", type: "textarea", required: true },
  { key: "treatment", label: "Treatment given", type: "textarea" },
  { key: "cleared_to_fight", label: "Cleared to fight again", type: "checkbox" }
];

export function Incidents() {
  const store = useStore();
  const run = useAction();
  const exec = useCan("records.edit");
  const { rows, reload } = useTable("incidents");
  const [editing, setEditing] = useState<Incident | "new" | null>(null);
  return (
    <Page title="Incidents" intro="Log every injury, however small. The insurer asks for it, and it shows patterns worth fixing."
      actions={<button className="primary" onClick={() => setEditing("new")}>Report an incident</button>}>
      {!rows ? <Loading /> : rows.length === 0 ? <Empty>No incidents logged.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Who</th><th>What happened</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>{rows.map(i => (
              <tr key={i.id}>
                <td data-label="Date">{dateLabel(i.date)}</td>
                <td data-label="Who">{i.person}</td>
                <td data-label="What">{i.description}{i.treatment && <small className="muted block">Treatment: {i.treatment}</small>}</td>
                <td data-label="Status">{i.cleared_to_fight ? <Pill tone="done">Cleared</Pill> : <Pill tone="overdue">Not cleared</Pill>}</td>
                <td className="row-actions">{exec && <button className="ghost" onClick={() => setEditing(i)}>Edit</button>}</td>
              </tr>))}</tbody>
          </table>
        </div>)}
      {editing && (
        <Modal title={editing === "new" ? "Report an incident" : "Edit incident"} onClose={() => setEditing(null)}>
          <RecordForm fields={FIELDS} initial={editing === "new" ? { date: todayIso() } : editing}
            onSubmit={async v => {
              const ok = await run(() => editing === "new"
                ? store.insert("incidents", { ...v, reported_by: store.session.userId } as Partial<Incident>)
                : store.update("incidents", editing.id, v as Partial<Incident>), "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing !== "new" && exec ? async () => {
              if (confirm("Delete this incident?") && await run(() => store.remove("incidents", editing.id), "Deleted")) { setEditing(null); await reload(); }
            } : undefined} />
        </Modal>)}
    </Page>
  );
}

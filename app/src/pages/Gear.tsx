import { useState } from "react";
import type { Gear as GearItem } from "../data/types";
import { Modal, Page, Pill, RecordList, dateLabel, todayIso, useAction, useStore, useTable } from "../ui";

const daysSince = (iso: string | null) => iso ? Math.round((Date.now() - Date.parse(`${iso}T12:00:00`)) / 86400000) : Infinity;

export function Gear() {
  const store = useStore();
  const run = useAction();
  const { rows, reload } = useTable("gear");
  const [lending, setLending] = useState<GearItem | null>(null);
  const [person, setPerson] = useState("");
  const log = (gear_id: string, action: "out" | "in" | "inspected", who: string | null) => store.insert("gear_log", { gear_id, action, person: who });
  return (
    <Page title="Armory" intro="Loaner kit: who has it, what shape it's in, and when it was last inspected. Inspections older than 6 months are flagged.">
      <RecordList table="gear" noun="item" rows={rows} reload={reload}
        fields={[
          { key: "name", label: "Item", required: true, wide: true },
          { key: "code", label: "Tag code", hint: "Printed on the QR tag, e.g. RDR-H01" },
          { key: "kind", label: "Kind", type: "select", options: ["Helmet", "Gauntlets", "Body armour", "Arms", "Legs", "Shield", "Weapon", "Padding", "Other"] },
          { key: "condition", label: "Condition", type: "select", options: ["good", "new", "worn", "repair", "retired"] },
          { key: "last_inspected", label: "Last inspected", type: "date" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { label: "Item", render: g => <><strong>{g.name}</strong>{g.code && <small className="muted block">{g.code}</small>}</> },
          { label: "Condition", render: g => <Pill tone={g.condition === "repair" || g.condition === "retired" ? "overdue" : g.condition === "worn" ? "soon" : "done"}>{g.condition}</Pill> },
          { label: "Inspected", render: g => <>{dateLabel(g.last_inspected) || "Never"}{daysSince(g.last_inspected) > 182 && <> <Pill tone="overdue">Due</Pill></>}</> },
          { label: "With", render: g => g.holder_name ? <>{g.holder_name}<small className="muted block">since {dateLabel(g.checked_out_on)}</small></> : <span className="muted">In storage</span> }
        ]}
        extraActions={g => <>
          {g.holder_name
            ? <button onClick={() => run(async () => { await store.update("gear", g.id, { holder_name: null, holder_user: null, checked_out_on: null }); await log(g.id, "in", g.holder_name); }, "Checked in").then(reload)}>Check in</button>
            : <button onClick={() => { setPerson(""); setLending(g); }} disabled={g.condition === "repair" || g.condition === "retired"}>Lend</button>}
          <button className="ghost" onClick={() => run(async () => { await store.update("gear", g.id, { last_inspected: todayIso() }); await log(g.id, "inspected", store.session.name); }, "Inspection logged").then(reload)}>Inspected today</button>
        </>} />
      {lending && (
        <Modal title={`Lend ${lending.name}`} onClose={() => setLending(null)}>
          <form className="inline-form" onSubmit={async e => {
            e.preventDefault();
            if (!person.trim()) return;
            const ok = await run(async () => { await store.update("gear", lending.id, { holder_name: person.trim(), checked_out_on: todayIso() }); await log(lending.id, "out", person.trim()); }, "Lent out");
            if (ok) { setLending(null); await reload(); }
          }}>
            <input autoFocus placeholder="Who is borrowing it?" value={person} onChange={e => setPerson(e.target.value)} aria-label="Borrower" />
            <button className="primary">Lend</button>
          </form>
        </Modal>)}
    </Page>
  );
}

import { useState } from "react";
import type { Sponsor } from "../data/types";
import { Modal, Money, Page, Pill, RecordList, dateLabel, todayIso, useAction, useStore, useTable } from "../ui";

const STAGES: Sponsor["stage"][] = ["prospect", "contacted", "meeting", "proposal", "signed", "renewed", "lost"];

export function Sponsors() {
  const { rows, reload } = useTable("sponsors");
  const [open, setOpen] = useState<Sponsor | null>(null);
  const today = todayIso();
  const won = (rows || []).filter(s => s.stage === "signed" || s.stage === "renewed").reduce((sum, s) => sum + (s.value_cents || 0), 0);
  const pipeline = (rows || []).filter(s => ["prospect", "contacted", "meeting", "proposal"].includes(s.stage)).reduce((sum, s) => sum + (s.value_cents || 0), 0);
  return (
    <Page title="Sponsors" intro="From first email to signed deal and renewal. Every promise to a sponsor goes on its deliverables list.">
      <div className="pipeline">
        {STAGES.map(stage => <div key={stage}><span>{stage}</span><strong>{(rows || []).filter(s => s.stage === stage).length}</strong></div>)}
      </div>
      <p className="totals">Signed this season <Money cents={won} /> · In the pipeline <Money cents={pipeline} /></p>
      <RecordList table="sponsors" noun="sponsor" rows={rows} reload={reload}
        fields={[
          { key: "name", label: "Business", required: true, wide: true },
          { key: "stage", label: "Stage", type: "select", options: STAGES },
          { key: "tier", label: "Tier", type: "select", options: ["", "Squire", "Knight", "Warlord", "Custom"] },
          { key: "value_cents", label: "Value per season", type: "money" },
          { key: "in_kind", label: "In-kind (goods or services)", type: "checkbox" },
          { key: "contact_name", label: "Contact" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone" },
          { key: "website", label: "Website", type: "url" },
          { key: "next_follow_up", label: "Next follow-up", type: "date" },
          { key: "renews_on", label: "Renews on", type: "date" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { label: "Business", render: s => <><strong>{s.name}</strong>{s.contact_name && <small className="muted block">{s.contact_name}</small>}</> },
          { label: "Stage", render: s => <Pill tone={s.stage === "lost" ? "overdue" : s.stage === "signed" || s.stage === "renewed" ? "done" : "later"}>{s.stage}</Pill> },
          { label: "Tier", render: s => s.tier || "" },
          { label: "Value", render: s => <><Money cents={s.value_cents} />{s.in_kind && <small className="muted block">in-kind</small>}</>, className: "num" },
          { label: "Follow up", render: s => s.next_follow_up ? <Pill tone={s.next_follow_up <= today ? "overdue" : "later"}>{dateLabel(s.next_follow_up)}</Pill> : "" }
        ]}
        extraActions={s => <button className="ghost" onClick={() => setOpen(s)}>Deliverables</button>} />
      {open && <Deliverables sponsor={open} onClose={() => setOpen(null)} />}
    </Page>
  );
}

function Deliverables({ sponsor, onClose }: { sponsor: Sponsor; onClose: () => void }) {
  const store = useStore();
  const run = useAction();
  const { rows, reload } = useTable("sponsor_deliverables");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const mine = (rows || []).filter(d => d.sponsor_id === sponsor.id);
  return (
    <Modal title={`${sponsor.name}: deliverables`} onClose={onClose}>
      <ul className="checklist">
        {mine.length === 0 && <li className="muted">Nothing promised yet. Add the logo, banner, posts and anything else in the deal.</li>}
        {mine.map(d => (
          <li key={d.id}>
            <label><input type="checkbox" checked={Boolean(d.done_on)} onChange={e => run(() => store.update("sponsor_deliverables", d.id, { done_on: e.target.checked ? todayIso() : null })).then(reload)} /> {d.title}</label>
            {d.due && <small className="muted">due {dateLabel(d.due)}</small>}
            <button className="ghost" aria-label={`Remove ${d.title}`} onClick={() => run(() => store.remove("sponsor_deliverables", d.id)).then(reload)}>✕</button>
          </li>))}
      </ul>
      <form className="inline-form" onSubmit={async e => {
        e.preventDefault();
        if (!title.trim()) return;
        if (await run(() => store.insert("sponsor_deliverables", { sponsor_id: sponsor.id, title: title.trim(), due: due || null }))) { setTitle(""); setDue(""); await reload(); }
      }}>
        <input placeholder="e.g. Logo on fight tabards" value={title} onChange={e => setTitle(e.target.value)} aria-label="Deliverable" />
        <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due" />
        <button className="primary">Add</button>
      </form>
    </Modal>
  );
}

import { deadlineStatus, nextDue } from "../lib/compliance";
import { Page, Pill, RecordList, dateLabel, todayIso, useAction, useStore, useTable } from "../ui";

const LABEL = { done: "Done", overdue: "Overdue", soon: "Due soon", later: "Later" };

export function Compliance() {
  const store = useStore();
  const run = useAction();
  const { rows, reload } = useTable("compliance");
  const today = todayIso();
  return (
    <Page title="Deadlines" intro="Filings, licences, insurance and the AGM. Marking a yearly item done schedules next year's automatically.">
      <RecordList table="compliance" noun="deadline" rows={rows} reload={reload}
        fields={[
          { key: "title", label: "What", required: true, wide: true },
          { key: "authority", label: "Who it's with", hint: "Corporate Registry, CRA, AGLC, insurer…" },
          { key: "due", label: "Due", type: "date", required: true },
          { key: "recurrence", label: "Repeats", type: "select", options: ["yearly", "quarterly", "monthly", "once"] },
          { key: "owner", label: "Owner" },
          { key: "done_on", label: "Done on", type: "date" },
          { key: "link", label: "Link", type: "url", wide: true },
          { key: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { label: "What", render: c => <><strong>{c.title}</strong>{c.authority && <small className="muted block">{c.authority}</small>}</> },
          { label: "Due", render: c => dateLabel(c.due) },
          { label: "Status", render: c => { const s = deadlineStatus(c.due, today, c.done_on); return <Pill tone={s}>{LABEL[s]}</Pill>; } },
          { label: "Owner", render: c => c.owner || "" },
          { label: "Repeats", render: c => c.recurrence }
        ]}
        extraActions={c => !c.done_on && (
          <button onClick={() => run(async () => {
            await store.update("compliance", c.id, { done_on: today });
            const next = nextDue(c.due, c.recurrence);
            if (next) await store.insert("compliance", { title: c.title, authority: c.authority, due: next, recurrence: c.recurrence, owner: c.owner, link: c.link, notes: c.notes });
          }, "Marked done").then(reload)}>Done</button>)} />
    </Page>
  );
}

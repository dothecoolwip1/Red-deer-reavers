import { Money, Page, Pill, RecordList, dateLabel, useTable } from "../ui";

export function Grants() {
  const { rows, reload } = useTable("grants");
  return (
    <Page title="Grants" intro="Applications from first look to final report. Worth watching: Alberta CIP and CFEP, City of Red Deer community grants, Jumpstart and KidSport for youth fees.">
      <RecordList table="grants" noun="grant" rows={rows} reload={reload}
        fields={[
          { key: "name", label: "Grant", required: true, wide: true },
          { key: "funder", label: "Funder" },
          { key: "stage", label: "Stage", type: "select", options: ["researching", "drafting", "submitted", "awarded", "declined", "reporting", "closed"] },
          { key: "amount_cents", label: "Amount", type: "money" },
          { key: "deadline", label: "Application deadline", type: "date" },
          { key: "report_due", label: "Final report due", type: "date" },
          { key: "link", label: "Link", type: "url", wide: true },
          { key: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { label: "Grant", render: g => <><strong>{g.name}</strong>{g.funder && <small className="muted block">{g.funder}</small>}</> },
          { label: "Stage", render: g => <Pill tone={g.stage === "awarded" ? "done" : g.stage === "declined" ? "overdue" : "later"}>{g.stage}</Pill> },
          { label: "Amount", render: g => <Money cents={g.amount_cents} />, className: "num" },
          { label: "Deadline", render: g => dateLabel(g.deadline) },
          { label: "Report due", render: g => dateLabel(g.report_due) }
        ]} />
    </Page>
  );
}

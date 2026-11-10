import { useState } from "react";
import { INQUIRY_STATUSES } from "../../data/website";
import { Empty, Page, Pill, dateLabel } from "../../ui";
import { CaptainOnly, longDate, titleCase, useSite } from "./shared";

export function Inquiries() {
  const { data, failed, act } = useSite();
  const [show, setShow] = useState<"open" | "all">("open");
  return (
    <Page title="Community inquiries" intro="Schools, festivals, birthdays, community groups and partners who asked to book the Reavers from the website's Community page.">
      <CaptainOnly data={data} failed={failed}>{d => {
        const all = d.communityInquiries;
        const open = all.filter(i => !["closed", "declined"].includes(i.status || "new"));
        const list = show === "open" ? open : all;
        return (<>
          <div className="toolbar">
            <div className="segmented" role="tablist">
              <button role="tab" aria-selected={show === "open"} onClick={() => setShow("open")}>Open ({open.length})</button>
              <button role="tab" aria-selected={show === "all"} onClick={() => setShow("all")}>All ({all.length})</button>
            </div>
          </div>
          {list.length === 0 ? <Empty>{all.length ? "Nothing open. Every inquiry is closed or declined." : "No community inquiries yet."}</Empty> : (
            <div className="cards">
              {list.map(i => (
                <article key={i.id} className="card inquiry">
                  <header>
                    <div>
                      <Pill tone={i.status === "booked" ? "done" : i.status === "new" || !i.status ? "soon" : undefined}>{titleCase(i.event_type || "community event")}</Pill>
                      <h2>{i.name}</h2>
                      {i.organization && <small className="muted">{i.organization}</small>}
                    </div>
                    <small className="muted">{dateLabel(i.created_at)}</small>
                  </header>
                  <p><b>{i.contact}</b><br /><span className="muted">{i.event_date ? longDate(i.event_date) : "Date not set"}{i.location && ` · ${i.location}`}{i.audience_size && ` · about ${i.audience_size} people`}</span></p>
                  {i.details && <p>{i.details}</p>}
                  <div className="inline-form">
                    <select aria-label={`Status of ${i.name}'s inquiry`} value={i.status || "new"} onChange={e => void act({ action: "community_inquiry_status", id: i.id, status: e.target.value }, "Inquiry updated")}>
                      {INQUIRY_STATUSES.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </select>
                    <button className="danger" onClick={() => { if (confirm("Delete this community inquiry? This cannot be undone.")) void act({ action: "community_inquiry_delete", id: i.id }, "Inquiry deleted"); }}>Delete</button>
                  </div>
                </article>))}
            </div>)}
        </>);
      }}</CaptainOnly>
    </Page>
  );
}

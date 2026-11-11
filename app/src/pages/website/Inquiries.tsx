import { useState } from "react";
import { Link } from "react-router-dom";
import { INQUIRY_STATUSES } from "../../data/website";
import { Empty, Page, Pill, dateLabel, useAction, usePage, useStore, useTable } from "../../ui";
import { isNewWebInquiry } from "../Sponsors";
import { CaptainOnly, longDate, titleCase, useSite } from "./shared";

export function Inquiries() {
  const { data, failed, act } = useSite();
  const [show, setShow] = useState<"open" | "all">("open");
  return (
    <Page title="Inquiries" intro="Businesses who asked to sponsor the Reavers on the website's Sponsors page, and schools, festivals, birthdays and community groups who asked to book the Reavers from the Community page.">
      <SponsorInquiries />
      <h2 className="section-title">Community inquiries</h2>
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

/** "Become a sponsor" messages from the website. They live in the Sponsors pipeline as prospects marked "from the website". */
function SponsorInquiries() {
  const level = usePage("sponsors");
  if (level < 1) return null;
  return <SponsorInquiryList canEdit={level >= 2} />;
}

function SponsorInquiryList({ canEdit }: { canEdit: boolean }) {
  const store = useStore();
  const run = useAction();
  const { rows, reload } = useTable("sponsors");
  const fresh = (rows || []).filter(isNewWebInquiry).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return (
    <section className="inquiry-section" aria-labelledby="sponsor-inquiries">
      <h2 id="sponsor-inquiries">Sponsor inquiries {fresh.length > 0 && <Pill tone="soon">{fresh.length} new</Pill>}</h2>
      {rows && fresh.length === 0 ? <Empty>No new sponsor inquiries. Everyone who asked has been moved along in <Link to="/sponsors">Sponsors</Link>.</Empty> : (
        <div className="cards">
          {fresh.map(s => (
            <article key={s.id} className="card inquiry">
              <header>
                <div>
                  <Pill tone="soon">{s.tier ? `${s.tier} sponsor` : "Sponsor"}</Pill>
                  <h2>{s.name}</h2>
                  {s.contact_name && <small className="muted">{s.contact_name}</small>}
                </div>
                {s.created_at && <small className="muted">{dateLabel(s.created_at)}</small>}
              </header>
              <p><b>{[s.email, s.phone].filter(Boolean).join(" · ")}</b>{s.website && <><br /><a href={s.website} target="_blank" rel="noopener noreferrer">{s.website}</a></>}</p>
              {s.notes && <p className="pre">{s.notes.replace(/^From the website sponsor form:?\n?/, "")}</p>}
              <div className="inline-form">
                {canEdit && <button className="primary" onClick={() => void run(() => store.update("sponsors", s.id, { stage: "contacted" }), "Marked as contacted").then(reload)}>Mark contacted</button>}
                <Link className="button ghost" to="/sponsors">Open in Sponsors</Link>
              </div>
            </article>))}
        </div>)}
    </section>
  );
}

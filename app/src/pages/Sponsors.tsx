import { useState } from "react";
import { SITE_URL } from "../data/config";
import type { Sponsor } from "../data/types";
import { Modal, Money, Page, Pill, RecordList, dateLabel, errorText, todayIso, useAction, usePage, useStore, useTable, useToast } from "../ui";

const STAGES: Sponsor["stage"][] = ["prospect", "contacted", "meeting", "proposal", "signed", "renewed", "lost"];
/** The tiers the website's Sponsors page offers (sponsors.html). Older records may still say Squire, Knight or Warlord. */
export const TIERS = ["Gold", "Silver", "Bronze", "In-kind"];
const LIVE = (s: Sponsor) => s.stage === "signed" || s.stage === "renewed";
/** A new business that asked through the website's "Become a sponsor" form and nobody has moved along yet. */
export const isNewWebInquiry = (s: Sponsor) => s.source === "website" && s.stage === "prospect";

export function Sponsors() {
  const { rows, reload } = useTable("sponsors");
  const [open, setOpen] = useState<Sponsor | null>(null);
  const [listing, setListing] = useState<Sponsor | null>(null);
  const canEdit = usePage("sponsors") >= 2;
  const store = useStore();
  // Before migration 20261112000000 the website columns don't exist; live rows then come back without show_on_site.
  const needsUpdate = store.session.mode === "live" && Boolean(rows?.length) && !("show_on_site" in (rows![0] as object));
  const onSite = (rows || []).filter(s => s.show_on_site && LIVE(s));
  const fresh = (rows || []).filter(isNewWebInquiry);
  const today = todayIso();
  const won = (rows || []).filter(s => s.stage === "signed" || s.stage === "renewed").reduce((sum, s) => sum + (s.value_cents || 0), 0);
  const pipeline = (rows || []).filter(s => ["prospect", "contacted", "meeting", "proposal"].includes(s.stage)).reduce((sum, s) => sum + (s.value_cents || 0), 0);
  return (
    <Page title="Sponsors" intro="From first email to signed deal and renewal. Every promise to a sponsor goes on its deliverables list.">
      <div className="pipeline">
        {STAGES.map(stage => <div key={stage}><span>{stage}</span><strong>{(rows || []).filter(s => s.stage === stage).length}</strong></div>)}
      </div>
      <p className="totals">Signed this season <Money cents={won} /> · In the pipeline <Money cents={pipeline} /></p>
      {needsUpdate && <p className="banner">The website's Sponsors page needs a one-time database update (20261112000000_reavers_app_sponsors_public.sql) before logos and listings can be saved.</p>}
      <p className="totals">
        On the website: {onSite.length ? onSite.map(s => s.name).join(", ") : "nobody yet. Open a signed sponsor's Website button to list them."}{" "}
        · <a href={`${SITE_URL}sponsors.html`} target="_blank" rel="noopener">View the Sponsors page</a>
        {fresh.length > 0 && <> · <Pill tone="soon">{fresh.length} new from the website</Pill></>}
      </p>
      <RecordList table="sponsors" noun="sponsor" rows={rows} reload={reload}
        fields={[
          { key: "name", label: "Business", required: true, wide: true },
          { key: "stage", label: "Stage", type: "select", options: STAGES },
          { key: "tier", label: "Tier", type: "select", options: ["", ...TIERS, "Custom"], hint: "Gold $1,000+, Silver $500+, Bronze $250+, as on the website" },
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
          { label: "Business", render: s => <><strong>{s.name}</strong>{s.contact_name && <small className="muted block">{s.contact_name}</small>}{s.source === "website" && <small className="muted block">from the website{s.created_at ? `, ${dateLabel(s.created_at)}` : ""}</small>}</> },
          { label: "Stage", render: s => <Pill tone={s.stage === "lost" ? "overdue" : s.stage === "signed" || s.stage === "renewed" ? "done" : "later"}>{s.stage}</Pill> },
          { label: "Tier", render: s => s.tier || "" },
          { label: "Website", render: s => s.show_on_site ? <Pill tone={LIVE(s) ? "done" : "soon"}>{LIVE(s) ? "listed" : "once signed"}</Pill> : <span className="muted">no</span> },
          { label: "Value", render: s => <><Money cents={s.value_cents} />{s.in_kind && <small className="muted block">in-kind</small>}</>, className: "num" },
          { label: "Follow up", render: s => s.next_follow_up ? <Pill tone={s.next_follow_up <= today ? "overdue" : "later"}>{dateLabel(s.next_follow_up)}</Pill> : "" }
        ]}
        extraActions={s => <>{canEdit && <button className="ghost" onClick={() => setListing(s)}>Website</button>}<button className="ghost" onClick={() => setOpen(s)}>Deliverables</button></>} />
      {open && <Deliverables sponsor={open} onClose={() => setOpen(null)} />}
      {listing && <Listing sponsor={listing} onClose={() => setListing(null)} onSaved={async () => { setListing(null); await reload(); }} />}
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

/** How a sponsor appears on the website's Sponsors page: logo, one line, and whether they are listed at all. */
function Listing({ sponsor, onClose, onSaved }: { sponsor: Sponsor; onClose: () => void; onSaved: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const toast = useToast();
  const [logo, setLogo] = useState(sponsor.logo_url || "");
  const [blurb, setBlurb] = useState(sponsor.blurb || "");
  const [show, setShow] = useState(Boolean(sponsor.show_on_site));
  const [busy, setBusy] = useState(false);
  const live = LIVE(sponsor);
  return (
    <Modal title={`${sponsor.name}: on the website`} onClose={onClose}>
      <form className="form" onSubmit={async e => {
        e.preventDefault();
        const ok = await run(() => store.update("sponsors", sponsor.id, { logo_url: logo.trim() || null, blurb: blurb.trim() || null, show_on_site: show }), "Saved");
        if (ok) await onSaved();
      }}>
        <div className="sponsor-preview">
          {logo ? <img src={logo} alt={`${sponsor.name} logo`} /> : <span className="muted">No logo yet</span>}
          <div><strong>{sponsor.name}</strong><small className="muted block">{sponsor.tier || "No tier"}{sponsor.website && ` · ${sponsor.website}`}</small>{blurb && <p>{blurb}</p>}</div>
        </div>
        <div className="grid">
          <label className="wide"><span>Logo</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" disabled={busy} onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try { setLogo(await store.uploadSponsorLogo(file)); } catch (err) { toast(errorText(err), true); }
              setBusy(false);
            }} />
            <small>A PNG with a transparent background looks best. Up to 8 MB.</small>
          </label>
          <label className="wide"><span>Or a logo address</span><input type="url" placeholder="https://" value={logo.startsWith("data:") ? "" : logo} onChange={e => setLogo(e.target.value)} /></label>
          <label className="wide"><span>One line about them</span><textarea rows={2} maxLength={280} value={blurb} onChange={e => setBlurb(e.target.value)} placeholder="e.g. Custom steel and fabrication in Red Deer." /></label>
          <label className="check wide"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> Show on the website's Sponsors page</label>
        </div>
        {show && !live && <p className="muted small">They'll appear once their stage is Signed or Renewed. Right now it's {sponsor.stage}.</p>}
        <div className="form-actions">
          {logo && <button type="button" className="ghost" onClick={() => setLogo("")}>Remove logo</button>}
          <button type="submit" className="primary" disabled={busy}>{busy ? "Uploading…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

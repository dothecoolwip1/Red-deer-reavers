import { useCallback, useEffect, useState } from "react";
import { SITE_URL } from "../../data/config";
import { BOS_APP, HIDE, TEAM_SLUG, hiddenFighterId, isHideRecord, sameName, type BosFighter, type ClubMember, type ClubMembers, type SiteData, type SitePerson } from "../../data/website";
import { Empty, Modal, Page, Pill, RecordForm, useStore } from "../../ui";
import { CaptainOnly, titleCase, useSite } from "./shared";

const BLANK = { discipline: null, experience_years: null, affiliations: null, experience_summary: null, bio: null, photo_url: null, is_example: false };

export function TeamPage() {
  const store = useStore();
  const { data, failed, act } = useSite();
  const [fighters, setFighters] = useState<BosFighter[] | null | undefined>(undefined);
  const [members, setMembers] = useState<ClubMembers | null | undefined>(undefined);
  const [editing, setEditing] = useState<Partial<SitePerson> | null>(null);
  const [busy, setBusy] = useState("");
  const loadBos = useCallback(() => {
    store.website.fighters().then(setFighters, () => setFighters(null));
    store.website.clubMembers().then(setMembers, () => setMembers(null));
  }, [store]);
  useEffect(loadBos, [loadBos]);

  const busyWhile = async (key: string, fn: () => Promise<unknown>) => { setBusy(key); try { await fn(); } finally { setBusy(""); } };

  return (
    <Page title="Team page" intro="Who shows on the public Team page: fighters from BuhurtOS, club members, and the crew, coaches and media you add here.">
      <CaptainOnly data={data} failed={failed}>{d => {
        const markers = d.roster.filter(isHideRecord);
        const people = d.roster.filter(p => !isHideRecord(p)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
        const move = (index: number, by: number) => {
          const ids = people.map(p => p.id);
          const [id] = ids.splice(index, 1);
          ids.splice(index + by, 0, id);
          return busyWhile(`move-${id}`, () => act({ action: "roster_reorder", ids }, "Order saved"));
        };
        return (<>
          <section className="card section">
            <header className="section-head">
              <div><p className="kicker">Live from BuhurtOS</p><h2>Fighter profiles</h2></div>
              <div className="page-actions">
                <a className="button primary" href={`${BOS_APP}/team-manager`} target="_blank" rel="noopener">Approve join requests</a>
                <a className="button" href={`${BOS_APP}/teams/${TEAM_SLUG}`} target="_blank" rel="noopener">Team on BuhurtOS</a>
                <a className="button" href={`${SITE_URL}team.html#add-profile`} target="_blank" rel="noopener">Share the sign-up steps</a>
              </div>
            </header>
            <p className="muted small">Fighters build their own profile on BuhurtOS and ask to join the Reavers. Once a captain approves them there, they appear on the Team page with their photo and record. If someone steps away for a while, <b>Hide</b> takes them off the website without touching BuhurtOS.</p>
            {fighters === undefined ? <p className="muted">Loading fighters from BuhurtOS…</p>
              : fighters === null ? <p className="muted">BuhurtOS could not be reached just now. The public Team page retries on its own.</p>
              : fighters.length === 0 ? <Empty>No fighters on the BuhurtOS roster yet. Share the sign-up steps with the team.</Empty> : (
                <ul className="rows">
                  {fighters.map(f => {
                    const marker = markers.find(m => hiddenFighterId(m) === f.id.toLowerCase());
                    return (
                      <li key={f.id} className={marker ? "dim" : ""}>
                        <div><strong>{f.name}</strong> <small className="muted">{f.captain && "Captain · "}{marker ? "Hidden from website" : f.hasPhoto ? "Shown · has photo" : "Shown · no photo yet"}</small></div>
                        <div className="row-actions">
                          <a className="button ghost" href={f.cardUrl} target="_blank" rel="noopener">View card</a>
                          <button className={marker ? "primary" : ""} disabled={busy === f.id} aria-label={`${marker ? "Show" : "Hide"} ${f.name} ${marker ? "on" : "from"} the website`}
                            onClick={() => busyWhile(f.id, () => marker
                              ? act({ action: "roster_delete", id: marker.id }, `${f.name} is shown on the website again`)
                              : act({ action: "roster_save", item: { ...BLANK, name: f.name, role: "Hidden from website", discipline: HIDE + f.id.toLowerCase(), active: true, sort_order: 9000 } }, `${f.name} is hidden from the website`))}>
                            {marker ? "Show" : "Hide"}
                          </button>
                        </div>
                      </li>);
                  })}
                </ul>)}
          </section>

          <ClubMembersCard members={members} data={d} busy={busy} onToggle={(m, rec) => busyWhile(m.membership_id, () => rec
            ? act({ action: "roster_save", item: { ...rec, active: !rec.active } }, rec.active ? `${m.full_name} is off the website` : `${m.full_name} is on the website`)
            : act({ action: "roster_save", item: { ...BLANK, name: m.full_name, role: m.office || "Member", active: true, sort_order: 500 } }, `${m.full_name} is on the website`))} />

          <section className="card section">
            <header className="section-head">
              <div><p className="kicker">Added here</p><h2>Crew, leadership, coaches and media</h2></div>
              <button className="primary" onClick={() => setEditing({ role: "Team member", active: true, is_example: false, sort_order: (people.length + 1) * 10 })}>Add person</button>
            </header>
            <p className="muted small">People without a BuhurtOS fighter profile. Anyone whose name matches a BuhurtOS fighter is merged into that fighter's card. Use the arrows to set the order they appear in.</p>
            {people.length === 0 ? <Empty>No one added yet.</Empty> : (
              <ul className="rows">
                {people.map((p, i) => (
                  <li key={p.id} className={p.active ? "" : "dim"}>
                    <img className="thumb" src={p.photo_url || `${import.meta.env.BASE_URL}crest.png`} alt="" width="44" height="44" loading="lazy" />
                    <div>
                      <strong>{p.name}</strong>
                      <small className="muted block">{p.role || "Team member"}{p.discipline && ` · ${p.discipline}`}{p.experience_years !== null && p.experience_years !== undefined && ` · ${p.experience_years}+ yrs`}</small>
                      {p.affiliations && <small className="muted block">{p.affiliations}</small>}
                      <span className="tags">{p.is_example && <Pill tone="soon">sample profile</Pill>} {p.active ? <Pill tone="done">shown on site</Pill> : <Pill>not shown</Pill>}</span>
                    </div>
                    <div className="row-actions">
                      <button className="ghost" aria-label={`Move ${p.name} up`} disabled={i === 0 || !!busy} onClick={() => move(i, -1)}>↑</button>
                      <button className="ghost" aria-label={`Move ${p.name} down`} disabled={i === people.length - 1 || !!busy} onClick={() => move(i, 1)}>↓</button>
                      <button disabled={busy === p.id} onClick={() => busyWhile(p.id, () => act({ action: "roster_save", item: { ...p, active: !p.active } }, p.active ? "Removed from the public Team page" : "Shown on the public Team page"))}>{p.active ? "Hide" : "Show"}</button>
                      <button className="ghost" onClick={() => setEditing(p)}>Edit</button>
                    </div>
                  </li>))}
              </ul>)}
          </section>
        </>);
      }}</CaptainOnly>
      {editing && (
        <Modal title={editing.id ? "Edit person" : "Add person"} onClose={() => setEditing(null)}>
          <RecordForm
            fields={[
              { key: "name", label: "Name", required: true },
              { key: "role", label: "Role", hint: "Fighter, squire, team ops…" },
              { key: "discipline", label: "Discipline or specialty", hint: "Melee, duels, armour support…" },
              { key: "experience_years", label: "Years of experience", type: "number" },
              { key: "affiliations", label: "Affiliations", wide: true, hint: "Clubs, teams, organizations" },
              { key: "experience_summary", label: "Experience and highlights", type: "textarea" },
              { key: "bio", label: "Short bio", type: "textarea" },
              { key: "photo_url", label: "Photo address, optional", type: "url", wide: true, hint: "https://… (upload pictures with the Site editor's image tool)" },
              { key: "sort_order", label: "Sort order", type: "number" },
              { key: "active", label: "Show on the website", type: "checkbox" },
              { key: "is_example", label: "Mark as sample profile", type: "checkbox" }
            ]}
            initial={editing}
            onSubmit={async values => {
              const item = { ...values, id: editing.id, sort_order: Number(values.sort_order) || 0 } as Partial<SitePerson>;
              if (await act({ action: "roster_save", item }, "Saved")) setEditing(null);
            }}
            onDelete={editing.id ? async () => { if (confirm("Delete this person? This cannot be undone.") && await act({ action: "roster_delete", id: editing.id! }, "Deleted")) setEditing(null); } : undefined}
          />
        </Modal>)}
    </Page>
  );
}

const STATUS: Record<string, string> = { active: "Active member", pending: "Application pending", inactive: "Inactive", removed: "Removed" };
const dues = (m: ClubMember, waived: boolean) =>
  waived || m.dues_status === "waived" ? "fee waived" : m.dues_status === "paid" ? "fee paid" : m.dues_status === "gear_contribution" ? "gear contribution" : "fee unpaid";

function ClubMembersCard({ members, data, busy, onToggle }: {
  members: ClubMembers | null | undefined; data: SiteData; busy: string; onToggle: (m: ClubMember, record: SitePerson | undefined) => void;
}) {
  const recordFor = (m: ClubMember) => data.roster.find(p => !isHideRecord(p) && sameName(p.name, m.full_name));
  const list = members?.ok ? members.members.filter(m => m.status !== "removed")
    .sort((a, b) => (({ active: 0, pending: 1, inactive: 2 } as Record<string, number>)[a.status] ?? 9) - (({ active: 0, pending: 1, inactive: 2 } as Record<string, number>)[b.status] ?? 9) || a.full_name.localeCompare(b.full_name)) : [];
  const active = list.filter(m => m.status === "active").length, pending = list.filter(m => m.status === "pending").length;
  return (
    <section className="card section">
      <header className="section-head">
        <div><p className="kicker">Live from BuhurtOS</p><h2>Club members {members?.ok && <small className="muted">{active} active{pending ? `, ${pending} pending` : ""}</small>}</h2></div>
        <div className="page-actions">
          <a className="button primary" href={`${SITE_URL}members.html?view=members`}>Manage members</a>
          <a className="button" href={`${SITE_URL}members.html?view=agm-admin`}>AGM admin</a>
        </div>
      </header>
      <p className="muted small">The membership (applications, dues and AGM voting) is kept in BuhurtOS and managed in the members area. Members without a fighter profile can be put on the Team page here, with their office as their role.</p>
      {members === undefined ? <p className="muted">Loading the membership…</p>
        : members === null ? <p className="muted">Could not reach BuhurtOS just now.</p>
        : !members.ok ? <p className="muted">{members.reason}</p>
        : list.length === 0 ? <Empty>No club members yet. Members join through the members area.</Empty> : (
          <ul className="rows">
            {list.map(m => {
              const rec = recordFor(m), shown = Boolean(rec?.active);
              return (
                <li key={m.membership_id} className={m.status === "active" ? "" : "dim"}>
                  <div>
                    {m.fighter_id ? <a href={`${BOS_APP}/fighters/${encodeURIComponent(m.fighter_id)}`} target="_blank" rel="noopener"><strong>{m.full_name}</strong></a> : <strong>{m.full_name}</strong>}
                    <small className="muted block">{[STATUS[m.status] || titleCase(m.status || ""), m.office, dues(m, members.feeWaived), m.eligible ? "can vote" : "cannot vote", m.fighter_id ? "fighter profile" : shown ? "shown on website" : "not on website"].filter(Boolean).join(" · ")}</small>
                  </div>
                  {!m.fighter_id && (
                    <div className="row-actions">
                      <button className={shown ? "" : "primary"} disabled={busy === m.membership_id} onClick={() => onToggle(m, rec)}>{shown ? "Hide" : "Show on website"}</button>
                    </div>)}
                </li>);
            })}
          </ul>)}
    </section>
  );
}

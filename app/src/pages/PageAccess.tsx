import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccessPerson, PageAccessRow } from "../data/access";
import { PAGES, accessLabel, choicesFor, defaultLevel, levelFor, toAccess, type Access, type PageId, type PageInfo } from "../lib/pages";
import { Empty, Loading, Page, Pill, errorText, useAction, useStore } from "../ui";

const ROLE_LABEL = { finance: "Admin", exec: "Executive", member: "Member", none: "Not on the team" } as const;
const GROUPS = [...new Set(PAGES.map(p => p.group))];
type Overrides = Map<string, Access>;
const key = (user: string, page: PageId) => `${user}|${page}`;

/** Treasury chooses who can see and use each staff page. The database applies the same rules to the pages' records. */
export function PageAccess() {
  const store = useStore();
  const run = useAction();
  const [people, setPeople] = useState<AccessPerson[] | null>(null);
  const [overrides, setOverrides] = useState<Overrides>(new Map());
  const [problem, setProblem] = useState("");
  const [view, setView] = useState<"person" | "page">("person");
  const [picked, setPicked] = useState<string>("");
  const [page, setPage] = useState<PageId>("ledger");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, rows] = await Promise.all([store.access.people(), store.access.rows()]);
      setPeople(p);
      setOverrides(new Map(rows.map((r: PageAccessRow) => [key(r.user_id, r.page), r.access])));
      setPicked(cur => cur || p.find(x => x.role !== "finance")?.user_id || p[0]?.user_id || "");
    } catch (e) {
      setProblem(errorText(e));
      setPeople([]);
    }
  }, [store]);
  useEffect(() => { void load(); }, [load]);

  async function choose(person: AccessPerson, info: PageInfo, access: Access) {
    // Picking what their role already gives clears the override, so they keep following their role.
    const value = access === toAccess(defaultLevel(person.role, info.id)) ? null : access;
    const ok = await run(() => store.access.set(person.user_id, info.id, value), `${person.name}: ${info.label} → ${accessLabel(access, info)}`);
    if (ok) setOverrides(m => { const n = new Map(m); if (value) n.set(key(person.user_id, info.id), value); else n.delete(key(person.user_id, info.id)); return n; });
  }

  const shown = useMemo(() => (people || []).filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase())), [people, q]);
  const changes = (u: string) => PAGES.filter(p => overrides.has(key(u, p.id))).length;
  const person = people?.find(p => p.user_id === picked);

  return (
    <Page title="Page access" intro="Choose who can see and use each page of the app. Admins (the treasurer, president, captains and the BuhurtOS owner) always have every page. Everyone keeps Home, Reimbursements, Pay the club, Waiver and Incidents.">
      <div className="toolbar access-bar">
        <div className="segmented" role="tablist" aria-label="Arrange by">
          <button role="tab" aria-selected={view === "person"} onClick={() => setView("person")}>By person</button>
          <button role="tab" aria-selected={view === "page"} onClick={() => setView("page")}>By page</button>
        </div>
        <input type="search" placeholder="Find a person" value={q} onChange={e => setQ(e.target.value)} aria-label="Find a person" />
        {view === "page" && (
          <select value={page} onChange={e => setPage(e.target.value as PageId)} aria-label="Page">
            {GROUPS.map(g => <optgroup key={g} label={g}>{PAGES.filter(p => p.group === g).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup>)}
          </select>)}
      </div>
      {problem && <p className="error" role="alert">{problem}</p>}
      {people === null ? <Loading /> : people.length === 0 ? <Empty>Nobody on the Reavers roster yet.</Empty> : view === "person" ? (
        <div className="access">
          <ul className="access-people card" aria-label="People">
            {shown.map(p => (
              <li key={p.user_id}>
                <button className={p.user_id === picked ? "on" : ""} aria-current={p.user_id === picked ? "true" : undefined} onClick={() => setPicked(p.user_id)}>
                  <span>{p.name}</span>
                  <span className="access-tags">
                    {changes(p.user_id) > 0 && <Pill tone="soon">{changes(p.user_id)} changed</Pill>}
                    <Pill tone={p.role === "finance" ? "done" : p.role === "exec" ? "later" : ""}>{ROLE_LABEL[p.role]}</Pill>
                  </span>
                </button>
              </li>))}
            {shown.length === 0 && <li className="muted">No one matches.</li>}
          </ul>
          {person && (
            <section className="card access-pages" aria-label={`Pages for ${person.name}`}>
              <h2>{person.name}</h2>
              {person.role === "finance" ? <p className="muted">{person.name} is an admin and always has every page.</p> : (
                <>
                  <p className="muted small">Starts from what a{person.role === "exec" ? "n executive" : " member"} gets. Changes save straight away.</p>
                  {GROUPS.map(g => (
                    <div key={g} className="access-group">
                      <h3>{g}</h3>
                      {PAGES.filter(p => p.group === g).map(info => (
                        <AccessRow key={info.id} info={info} label={info.label} person={person} override={overrides.get(key(person.user_id, info.id))} onChoose={a => choose(person, info, a)} />))}
                    </div>))}
                </>)}
            </section>)}
        </div>
      ) : (
        <section className="card access-pages">
          {(() => {
            const info = PAGES.find(p => p.id === page)!;
            const count = (people || []).filter(p => levelFor(p.role, info.id, overrides.get(key(p.user_id, info.id))) > 0).length;
            return (
              <>
                <h2>{info.label}</h2>
                <p className="muted small">{count} of {people.length} people can open this page.{info.note ? ` ${info.note}` : ""}</p>
                {shown.map(p => p.role === "finance"
                  ? <div key={p.user_id} className="access-row"><span>{p.name} <Pill tone="done">Admin</Pill></span><span className="muted small">Always</span></div>
                  : <AccessRow key={p.user_id} info={info} label={p.name} person={p} override={overrides.get(key(p.user_id, info.id))} onChoose={a => choose(p, info, a)} hideNote />)}
              </>);
          })()}
        </section>)}
    </Page>
  );
}

function AccessRow({ info, label, person, override, onChoose, hideNote }: {
  info: PageInfo; label: string; person: AccessPerson; override?: Access; onChoose: (a: Access) => void; hideNote?: boolean;
}) {
  const current = toAccess(levelFor(person.role, info.id, override));
  const role = toAccess(defaultLevel(person.role, info.id));
  return (
    <div className={override ? "access-row changed" : "access-row"}>
      <span>
        {label}
        <small className="block muted">
          {override ? <>Changed · {ROLE_LABEL[person.role].toLowerCase()} default is {accessLabel(role, info).toLowerCase()} <button className="link inline" onClick={() => onChoose(role)}>Reset</button></> : "Default for their role"}
          {!hideNote && info.note && <> · {info.note}</>}
        </small>
      </span>
      <div className="segmented" role="radiogroup" aria-label={`${label}: access`}>
        {choicesFor(info).map(a => (
          <button key={a} role="radio" aria-checked={current === a} className={current === a ? "on" : ""} onClick={() => current !== a && onChoose(a)}>{accessLabel(a, info)}</button>))}
      </div>
    </div>
  );
}

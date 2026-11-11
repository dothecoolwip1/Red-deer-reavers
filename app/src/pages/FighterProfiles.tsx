import { useCallback, useEffect, useState } from "react";
import { SITE_URL } from "../data/config";
import { BOS_APP, type BosFighter } from "../data/website";
import type { MyFighter } from "../data/fighterProfiles";
import { LIMITS, TEAM_ROLES, WEIGHT_CLASSES, blankProfile, cleanProfile, missing, sponsorList, type FighterProfile } from "../lib/fighterProfile";
import { Empty, Loading, Modal, Page, Pill, errorText, usePage, useStore, useToast } from "../ui";

const profileUrl = (id: string) => `${SITE_URL}fighter.html?id=${encodeURIComponent(id)}`;

export function FighterProfiles() {
  const store = useStore();
  const toast = useToast();
  const teamLevel = usePage("team");
  const [mine, setMine] = useState<MyFighter[] | null>(null);
  const [profiles, setProfiles] = useState<FighterProfile[] | null>(null);
  const [roster, setRoster] = useState<BosFighter[] | null | undefined>(undefined);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([store.fighterProfiles.mine(), store.fighterProfiles.list()]);
      setMine(m); setProfiles(p);
    } catch (e) { toast(errorText(e), true); setMine([]); setProfiles([]); }
    if (teamLevel > 0) store.website.fighters().then(setRoster, () => setRoster(null));
  }, [store, toast, teamLevel]);
  useEffect(() => { void load(); }, [load]);

  const find = (id: string) => profiles?.find(p => p.fighter_id.toLowerCase() === id.toLowerCase());
  const saved = (p: FighterProfile) => setProfiles(list => [...(list || []).filter(x => x.fighter_id !== p.fighter_id), p]);

  return (
    <Page title="Fighter profiles" intro={<>What sponsors and fans see on <a href={`${SITE_URL}team.html`} target="_blank" rel="noopener">reddeerreavers.com</a>: your weight class, role on the team, an action photo, a highlight video and who sponsors you. Your photo, disciplines, bio and fight record still come from BuhurtOS.</>}>
      {mine === null || profiles === null ? <Loading /> : (<>
        {mine.length === 0 ? (
          <section className="card section">
            <p className="kicker">Your profile</p>
            <h2>No fighter profile on this account yet</h2>
            <p className="muted">Build your fighter profile on BuhurtOS and ask to join the Red Deer Reavers. Once a captain approves you, come back here to add your Reavers details.</p>
            <div className="page-actions"><a className="button primary" href={`${BOS_APP}/teams/red-deer-reavers`} target="_blank" rel="noopener">Join the Reavers on BuhurtOS</a></div>
          </section>
        ) : mine.map(f => (
          <section key={f.fighter_id} className="card section">
            <header className="section-head">
              <div><p className="kicker">Your profile</p><h2>{f.name}</h2></div>
              <a className="button" href={profileUrl(f.fighter_id)} target="_blank" rel="noopener">View on the website</a>
            </header>
            <ProfileEditor fighterId={f.fighter_id} name={f.name} initial={find(f.fighter_id)} self onSaved={saved} />
          </section>
        ))}

        {teamLevel > 0 && (
          <section className="card section">
            <header className="section-head">
              <div><p className="kicker">Team page</p><h2>Every Reavers fighter</h2></div>
              <a className="button" href={`${SITE_URL}team.html`} target="_blank" rel="noopener">Open the Team page</a>
            </header>
            <p className="muted small">Fighters fill these in themselves; {teamLevel > 1 ? "you can fill in or fix anyone's, and turn it on for them once they've agreed." : "you can see where everyone is."} A profile only shows on the website once it's turned on.</p>
            {roster === undefined ? <Loading /> : roster === null ? <p className="muted">BuhurtOS could not be reached just now.</p>
              : roster.length === 0 ? <Empty>No fighters on the BuhurtOS roster yet.</Empty> : (
                <ul className="rows">
                  {roster.map(f => {
                    const p = find(f.id);
                    const todo = missing(p);
                    return (
                      <li key={f.id} className={p?.show_on_site ? "" : "dim"}>
                        <img className="thumb" src={p?.photo_url || `${import.meta.env.BASE_URL}crest.png`} alt="" width="44" height="44" loading="lazy" />
                        <div>
                          <strong>{f.name}</strong>{p?.nickname && <small className="muted"> “{p.nickname}”</small>}
                          <small className="muted block">{[p?.weight_class, p?.team_role].filter(Boolean).join(" · ") || "No Reavers details yet"}</small>
                          <span className="tags">
                            {p?.show_on_site ? <Pill tone="done">on the website</Pill> : p ? <Pill>not turned on</Pill> : <Pill tone="soon">not started</Pill>}{" "}
                            {p?.open_to_sponsors && <Pill tone="later">open to sponsors</Pill>}{" "}
                            {todo.length > 0 && todo.length < 4 && <small className="muted">missing {todo.join(", ")}</small>}
                          </span>
                        </div>
                        <div className="row-actions">
                          <a className="button ghost" href={profileUrl(f.id)} target="_blank" rel="noopener">View</a>
                          {teamLevel > 1 && <button onClick={() => setEditing({ id: f.id, name: f.name })}>Edit</button>}
                        </div>
                      </li>);
                  })}
                </ul>)}
          </section>)}
      </>)}
      {editing && (
        <Modal title={`${editing.name}: Reavers profile`} onClose={() => setEditing(null)}>
          <ProfileEditor fighterId={editing.id} name={editing.name} initial={find(editing.id)} onSaved={p => { saved(p); setEditing(null); }} />
        </Modal>)}
    </Page>
  );
}

type Draft = Record<keyof Omit<FighterProfile, "fighter_id" | "updated_at" | "show_on_site" | "open_to_sponsors">, string> & { show_on_site: boolean; open_to_sponsors: boolean };
const toDraft = (p: FighterProfile): Draft => ({
  nickname: p.nickname || "", weight_class: p.weight_class || "", team_role: p.team_role || "", tagline: p.tagline || "",
  about: p.about || "", photo_url: p.photo_url || "", video_url: p.video_url || "", sponsors: p.sponsors || "",
  show_on_site: p.show_on_site, open_to_sponsors: p.open_to_sponsors
});

function ProfileEditor({ fighterId, name, initial, self, onSaved }: {
  fighterId: string; name: string; initial?: FighterProfile; self?: boolean; onSaved: (p: FighterProfile) => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [d, setD] = useState<Draft>(() => toDraft(initial || blankProfile(fighterId)));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(prev => ({ ...prev, [k]: v }));
  const field = (k: keyof typeof LIMITS) => ({ value: d[k], maxLength: LIMITS[k], onChange: (e: { target: { value: string } }) => set(k, e.target.value) });
  const ids = { weight: `wc-${fighterId}`, role: `role-${fighterId}` };
  const you = self ? "your" : `${name.split(" ")[0]}'s`;

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Choose a picture (JPG, PNG or WebP).", true);
    if (file.size > 8 * 1024 * 1024) return toast("That picture is over 8 MB. Choose a smaller one.", true);
    setUploading(true);
    try { set("photo_url", await store.fighterProfiles.uploadPhoto(fighterId, file)); toast("Photo uploaded. Save to keep it."); }
    catch (e) { toast(errorText(e), true); }
    finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = cleanProfile({ fighter_id: fighterId, ...d }, store.fighterProfiles.sample);
    if ("errors" in r) return setErrors(r.errors);
    setErrors([]);
    setBusy(true);
    try {
      await store.fighterProfiles.save(r.profile);
      onSaved(r.profile);
      toast(r.profile.show_on_site ? "Saved. It's on the website now." : "Saved. Turn on “Show on the website” when it's ready.");
    } catch (err) { toast(errorText(err), true); }
    finally { setBusy(false); }
  }

  const sponsors = sponsorList(d.sponsors);
  return (
    <div className="profile-editor">
      <form className="form" onSubmit={submit}>
        <label className="toggle">
          <input type="checkbox" checked={d.show_on_site} onChange={e => set("show_on_site", e.target.checked)} />
          <span><b>Show {you} Reavers profile on the website</b><small className="muted block">Off until {self ? "you're" : "they're"} happy with it. Turning it off hides these details again; {self ? "your" : "their"} BuhurtOS card stays.</small></span>
        </label>
        <div className="grid">
          <label><span>Nickname</span><input {...field("nickname")} placeholder="The Anvil" /></label>
          <label><span>Weight class</span><input {...field("weight_class")} list={ids.weight} placeholder="Heavyweight" />
            <datalist id={ids.weight}>{WEIGHT_CLASSES.map(w => <option key={w} value={w} />)}</datalist></label>
          <label><span>Role on the team</span><input {...field("team_role")} list={ids.role} placeholder="Line fighter" />
            <datalist id={ids.role}>{TEAM_ROLES.map(w => <option key={w} value={w} />)}</datalist></label>
          <label className="wide"><span>Motto</span><input {...field("tagline")} placeholder="Hold the line, then break it." /><small>One line, shown under the name. Up to {LIMITS.tagline} characters.</small></label>
          <label className="wide"><span>About, for sponsors and fans</span><textarea rows={4} {...field("about")} />
            <small>Optional. Why you fight, what you're training for, what a sponsor helps with. Your BuhurtOS bio shows too.</small></label>
          <div className="wide photo-field">
            <span>Action photo</span>
            <div className="photo-row">
              {d.photo_url ? <img src={d.photo_url} alt="" width="96" height="96" /> : <div className="photo-empty" aria-hidden="true">No photo</div>}
              <div className="photo-actions">
                <label className="button">{uploading ? "Uploading…" : d.photo_url ? "Change photo" : "Upload a photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
                {d.photo_url && <button type="button" className="ghost" onClick={() => set("photo_url", "")}>Remove</button>}
                <small className="muted block">A wide shot in armour works best. It's the big picture at the top of {you} page.</small>
              </div>
            </div>
          </div>
          <label className="wide"><span>Highlight video</span><input type="url" value={d.video_url} onChange={e => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            <small>A YouTube, Instagram, Facebook or TikTok link.</small></label>
          <label className="wide"><span>Sponsored by</span><input {...field("sponsors")} placeholder="Prairie Iron Works, Gaetz Ave Gym" /><small>Separate names with commas.</small></label>
          <label className="check wide"><input type="checkbox" checked={d.open_to_sponsors} onChange={e => set("open_to_sponsors", e.target.checked)} /> Open to new sponsors (adds a “Sponsor {self ? "me" : "this fighter"}” button)</label>
        </div>
        {errors.length > 0 && <div className="error" role="alert">{errors.map(x => <p key={x}>{x}</p>)}</div>}
        <div className="form-actions"><button type="submit" className="primary" disabled={busy || uploading}>{busy ? "Saving…" : "Save profile"}</button></div>
      </form>
      <aside className="profile-preview" aria-label="Preview">
        <p className="kicker">Preview</p>
        <div className="preview-card">
          <div className="preview-photo" style={d.photo_url ? { backgroundImage: `url("${d.photo_url.replace(/"/g, "%22")}")` } : undefined} />
          <strong>{name}</strong>
          {d.nickname.trim() && <em>“{d.nickname.trim()}”</em>}
          <small>{[d.weight_class.trim(), d.team_role.trim()].filter(Boolean).join(" · ") || "Weight class · role"}</small>
          {d.tagline.trim() && <p>{d.tagline.trim()}</p>}
          {sponsors.length > 0 && <small className="muted">Sponsored by {sponsors.join(", ")}</small>}
          {d.open_to_sponsors && <span className="pill later">Sponsor {self ? "me" : "this fighter"}</span>}
        </div>
        <small className="muted">{d.show_on_site ? "Shown on the website once saved." : "Not on the website yet."}</small>
      </aside>
    </div>
  );
}

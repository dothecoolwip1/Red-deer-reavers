import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { siteOrigin } from "../data/config";
import type { SiteContent } from "../data/types";
import { draftKey, effectiveValue, publishPlan, withChange, withReset, type Drafts, type Kind } from "../lib/siteDrafts";
import { Modal, Pill, errorText, useAction, useStore, useTable, useToast } from "../ui";

const PAGES = [
  ["index.html", "Home"], ["about.html", "About"], ["team.html", "Team"], ["training.html", "Training"],
  ["events.html", "Events"], ["community.html", "Community"], ["media.html", "Media"], ["social.html", "Social"], ["agm.html", "AGM"]
] as const;
const DEVICES = { desktop: { label: "Desktop", width: "100%" }, tablet: { label: "Tablet", width: "820px" }, phone: { label: "Phone", width: "390px" } };
type Unit = { key: string; kind: Kind; original: string; label: string; count: number };
const DRAFTS = "reavers-site-editor-drafts";

const loadDrafts = (): Drafts => { try { return JSON.parse(localStorage.getItem(DRAFTS) || "{}"); } catch { return {}; } };
const LABELS: Record<string, string> = { h1: "Title", h2: "Heading", h3: "Subheading", h4: "Subheading", p: "Paragraph", li: "List item", a: "Link", span: "Text", strong: "Bold text", em: "Emphasis", b: "Bold text", small: "Small print", figcaption: "Caption", blockquote: "Quote", button: "Button", dt: "Term", dd: "Detail", td: "Table cell", th: "Table heading", label: "Label" };

export function SiteEditor() {
  const store = useStore();
  const run = useAction();
  const toast = useToast();
  const origin = useMemo(siteOrigin, []);
  const frame = useRef<HTMLIFrameElement>(null);
  const [page, setPage] = useState<string>("index.html");
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [drafts, setDrafts] = useState<Drafts>(loadDrafts);
  const [undo, setUndo] = useState<Drafts[]>([]);
  const [tab, setTab] = useState<"content" | "history">("content");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [imageFor, setImageFor] = useState<Unit | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const published = useTable("site_content");
  const history = useTable("site_content_history");
  const live = published.rows || [];

  useEffect(() => { try { localStorage.setItem(DRAFTS, JSON.stringify(drafts)); } catch { /* ignore */ } }, [drafts]);

  const post = useCallback((message: object) => frame.current?.contentWindow?.postMessage(message, origin), [origin]);
  const valueOf = useCallback((u: { key: string; original: string }) => effectiveValue(drafts, live, { page, key: u.key, original: u.original }), [drafts, live, page]);

  // Push every draft and published value of this page into the preview (the site itself only knows published values).
  const sync = useCallback((list: Unit[]) => {
    for (const u of list) {
      const value = valueOf(u);
      if (value !== u.original || drafts[draftKey(page, u.key)] || live.some(r => r.page === page && r.key === u.key)) post({ type: "rv-apply", key: u.key, value });
    }
  }, [valueOf, drafts, live, page, post]);

  const change = useCallback((unit: Unit, value: string) => {
    setDrafts(prev => {
      const next = withChange(prev, live, { page, key: unit.key, kind: unit.kind, original: unit.original, value });
      if (next !== prev) setUndo(u => [...u.slice(-49), prev]);
      return next;
    });
  }, [live, page]);

  // Messages from the page in the frame.
  const unitsRef = useRef<Unit[] | null>(null);
  unitsRef.current = units;
  const handlers = useRef({ change, sync });
  handlers.current = { change, sync };
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || !e.data || typeof e.data !== "object" || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type: string; key?: string; value?: string; units?: Unit[] };
      if (m.type === "rv-ready" && Array.isArray(m.units)) { setUnits(m.units); setLoadFailed(false); handlers.current.sync(m.units); }
      const unit = unitsRef.current?.find(u => u.key === m.key);
      if (!unit) return;
      if (m.type === "rv-change" && typeof m.value === "string") handlers.current.change(unit, m.value);
      if (m.type === "rv-select") { setSelected(unit.key); setTab("content"); document.getElementById(`unit-${unit.key}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      if (m.type === "rv-pick-image") setImageFor(unit);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin]);

  // A page that never says hello is a page without the editor script (not deployed yet) or one that failed to load.
  useEffect(() => {
    setUnits(null); setSelected(null); setLoadFailed(false);
    const timer = setTimeout(() => setLoadFailed(unitsRef.current === null), 8000);
    return () => clearTimeout(timer);
  }, [page]);

  // Keep the preview in step after undo, discard, publish or edits from the side panel.
  useEffect(() => { if (units) sync(units); }, [drafts, published.rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageDrafts = Object.values(drafts).filter(d => d.page === page);
  const allDrafts = Object.values(drafts);
  const shown = (units || []).filter(u => !q || `${u.original} ${valueOf(u)}`.toLowerCase().includes(q.toLowerCase()));

  async function publish() {
    if (!allDrafts.length) return;
    setPublishing(true);
    const plan = publishPlan(drafts, live);
    const ok = await run(async () => {
      for (const id of plan.removes) await store.remove("site_content", id);
      for (const u of plan.updates) await store.update("site_content", u.id, { value: u.value });
      for (const row of plan.inserts) await store.insert("site_content", row as Partial<SiteContent>);
    }, `Published ${allDrafts.length} change${allDrafts.length === 1 ? "" : "s"} to the website`);
    setPublishing(false);
    if (ok) { setDrafts({}); setUndo([]); await Promise.all([published.reload(), history.reload()]); }
  }

  const src = `${origin}/${page}?reavers-edit=1`;
  return (
    <section className="editor">
      <header className="editor-bar">
        <select value={page} onChange={e => setPage(e.target.value)} aria-label="Page">
          {PAGES.map(([file, name]) => <option key={file} value={file}>{name}{Object.values(drafts).some(d => d.page === file) ? " •" : ""}</option>)}
        </select>
        <div className="segmented" role="group" aria-label="Preview size">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map(d => <button key={d} aria-pressed={device === d} onClick={() => setDevice(d)}>{DEVICES[d].label}</button>)}
        </div>
        <span className="editor-status">{allDrafts.length ? <Pill tone="soon">{allDrafts.length} unpublished</Pill> : <Pill tone="done">All changes live</Pill>}</span>
        <button onClick={() => { const prev = undo[undo.length - 1]; if (prev) { setDrafts(prev); setUndo(u => u.slice(0, -1)); } }} disabled={!undo.length}>Undo</button>
        <button onClick={() => { if (confirm("Throw away every unpublished change?")) { setUndo(u => [...u, drafts]); setDrafts({}); } }} disabled={!allDrafts.length}>Discard</button>
        <a className="button" href={`${origin}/${page}`} target="_blank" rel="noopener noreferrer">View live</a>
        <button className="primary" onClick={publish} disabled={!allDrafts.length || publishing}>{publishing ? "Publishing…" : "Publish"}</button>
      </header>
      <div className="editor-body">
        <div className="stage">
          <div className="device" style={{ width: DEVICES[device].width }}>
            <iframe ref={frame} key={page} src={src} title={`Editing ${page}`} onLoad={() => { if (unitsRef.current) sync(unitsRef.current); }} />
          </div>
          {loadFailed && (
            <div className="stage-note card">
              <strong>This page didn't connect to the editor.</strong>
              <p>The website needs the editor script that ships with this update (site-content.js). Once the update is live on {origin.replace("https://", "")}, click-to-edit works here. Until then, nothing on the page can be picked.</p>
            </div>)}
          <p className="hint">Click any text on the page to type over it, or click a picture to replace it. Press Enter when done. Nothing goes live until you press Publish.</p>
        </div>
        <aside className="inspector">
          <div className="segmented tabs" role="tablist">
            <button role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")}>Page content</button>
            <button role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>History</button>
          </div>
          {tab === "content" ? (
            <>
              <input type="search" placeholder="Find text on this page" value={q} onChange={e => setQ(e.target.value)} aria-label="Find text" />
              {pageDrafts.length > 0 && <p className="muted small">{pageDrafts.length} unpublished on this page</p>}
              {!units ? <p className="muted">{loadFailed ? "No editable content found." : "Loading the page…"}</p> : (
                <ul className="units">
                  {shown.map(u => {
                    const value = valueOf(u);
                    const draft = drafts[draftKey(page, u.key)];
                    const isLive = live.some(r => r.page === page && r.key === u.key);
                    return (
                      <li key={u.key} id={`unit-${u.key}`} className={selected === u.key ? "selected" : ""} onClick={() => { setSelected(u.key); post({ type: "rv-highlight", key: u.key }); }}>
                        <div className="unit-head">
                          <span className="unit-kind">{u.kind === "image" ? "Picture" : LABELS[u.label] || "Text"}{u.count > 1 ? ` ×${u.count}` : ""}</span>
                          {draft ? <Pill tone="soon">{draft.value === null ? "Back to original" : "Draft"}</Pill> : isLive ? <Pill tone="later">Edited</Pill> : null}
                        </div>
                        {u.kind === "image" ? (
                          <div className="unit-image">
                            <img src={value.startsWith("data:") || /^https?:/.test(value) ? value : `${origin}/${value.replace(/^\//, "")}`} alt="" loading="lazy" />
                            <div><button onClick={e => { e.stopPropagation(); setImageFor(u); }}>Replace</button></div>
                          </div>
                        ) : (
                          <TextField value={value} onCommit={v => change(u, v)} multiline={value.length > 70} />
                        )}
                        {(draft?.value || isLive) && value !== u.original && (
                          <div className="unit-foot">
                            <small className="muted" title={u.original}>Was: {u.kind === "image" ? "the original picture" : u.original}</small>
                            <button className="ghost" onClick={e => { e.stopPropagation(); setUndo(x => [...x, drafts]); setDrafts(d => withReset(d, live, { page, key: u.key, kind: u.kind, original: u.original })); }}>Reset</button>
                          </div>)}
                      </li>);
                  })}
                </ul>)}
            </>
          ) : (
            <ul className="units">
              {(history.rows || []).filter(h => h.page === page).slice(0, 60).map(h => {
                const unit = units?.find(u => u.key === h.key);
                return (
                  <li key={h.id}>
                    <div className="unit-head"><span className="unit-kind">{new Date(h.changed_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>{!unit && <Pill>Text no longer on page</Pill>}</div>
                    <p className="small">{h.kind === "image" ? "Picture changed" : <>“{h.value ?? h.original}”</>}{h.value === null && <span className="muted"> (original put back)</span>}</p>
                    {h.previous && h.kind === "text" && <small className="muted">Before: “{h.previous}”</small>}
                    {unit && <button className="ghost" onClick={() => { const v = h.value ?? h.original; change(unit, v); toast("Restored as a draft. Publish to make it live."); }}>Restore this version</button>}
                  </li>);
              })}
              {(history.rows || []).filter(h => h.page === page).length === 0 && <li className="muted">No published changes on this page yet.</li>}
            </ul>
          )}
        </aside>
      </div>
      {imageFor && <ImageDialog unit={imageFor} current={valueOf(imageFor)} origin={origin} onClose={() => setImageFor(null)}
        onPick={value => { change(imageFor, value); setImageFor(null); }}
        onReset={() => { setUndo(x => [...x, drafts]); setDrafts(d => withReset(d, live, { page, key: imageFor.key, kind: "image", original: imageFor.original })); setImageFor(null); }} />}
    </section>
  );
}

function TextField({ value, onCommit, multiline }: { value: string; onCommit: (v: string) => void; multiline: boolean }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = () => { if (text.trim() && text !== value) onCommit(text); else setText(value); };
  const props = {
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setText(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLElement).blur(); } if (e.key === "Escape") { setText(value); } },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    "aria-label": "Text"
  };
  return multiline ? <textarea rows={3} {...props} /> : <input {...props} />;
}

function ImageDialog({ unit, current, origin, onClose, onPick, onReset }: {
  unit: Unit; current: string; origin: string; onClose: () => void; onPick: (v: string) => void; onReset: () => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = current.startsWith("data:") || /^https?:/.test(current) ? current : `${origin}/${current.replace(/^\//, "")}`;
  return (
    <Modal title="Replace picture" onClose={onClose}>
      <img className="image-preview" src={preview} alt="Current" />
      <label className="drop">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) { toast("Pictures must be under 8 MB.", true); return; }
          setBusy(true);
          try { onPick(await store.uploadSiteImage(file)); } catch (err) { toast(errorText(err), true); }
          setBusy(false);
        }} />
        <strong>{busy ? "Uploading…" : "Upload a picture"}</strong>
        <span className="muted small">JPEG, PNG, WebP or AVIF, under 8 MB. Wide pictures work best.</span>
      </label>
      <form className="inline-form" onSubmit={e => { e.preventDefault(); if (/^https:\/\//i.test(url.trim())) onPick(url.trim()); else toast("Use an address that starts with https://", true); }}>
        <input placeholder="…or paste an https:// picture address" value={url} onChange={e => setUrl(e.target.value)} aria-label="Picture address" />
        <button>Use</button>
      </form>
      <div className="form-actions">
        {current !== unit.original && <button className="ghost" onClick={onReset}>Put the original back</button>}
        <button onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

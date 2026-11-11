import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { siteOrigin } from "../../data/config";
import { isMissingSetup } from "../../data/supabase";
import type { QrCode } from "../../data/types";
import { addLogo, cleanLink, makeTransparent, qrFileName, shortLink } from "../../lib/qr";
import crestUrl from "../../assets/qr-logo.png";
import { Empty, Loading, Modal, Page, errorText, usePage, useStore, useToast } from "../../ui";

// Generated on every site build (scripts/build-site.mjs), so they always point at the live pages.
const CODES = [
  { file: "home", title: "Reavers website", note: "Main team website", download: "reavers-website-qr.svg" },
  { file: "join", title: "Join the team", note: "Training and newcomer page", download: "reavers-join-qr.svg" },
  { file: "community", title: "Book the Reavers", note: "Community inquiry form", download: "reavers-community-qr.svg" },
  { file: "events", title: "Events", note: "Upcoming public schedule", download: "reavers-events-qr.svg" }
];

// One tap fills in a link the club often puts on posters.
const QUICK_LINKS = [
  { label: "Open pay page", title: "Pay the Reavers", note: "Visitor fees, stickers, cards and registration", url: "https://app.reddeerreavers.com/#/buy" },
  { label: "Get involved", title: "Get involved", note: "Volunteer and support the club", url: "https://reddeerreavers.com/involved.html" },
  { label: "Media", title: "Photos and video", note: "Reavers media page", url: "https://reddeerreavers.com/media.html" },
  { label: "Contact", title: "Contact the Reavers", note: "Get in touch", url: "https://reddeerreavers.com/contact.html" }
];

// Level H so the code still scans with the crest covering its middle (same as scripts/build-site.mjs).
const SVG_OPTIONS = { type: "svg", errorCorrectionLevel: "H", margin: 2, width: 720 } as const;

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

// The crest goes into each SVG as a data: address, so a downloaded file shows it anywhere. Loaded once.
let crestData: Promise<string> | null = null;
function crest(): Promise<string> {
  crestData ??= fetch(crestUrl).then(r => r.blob()).then(blob => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  }));
  return crestData;
}

/** Draws a QR code in the browser from a link, with the club crest in the middle. */
function useQrSvg(url: string | null) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!url) { setSvg(null); return; }
    Promise.all([QRCode.toString(url, SVG_OPTIONS), crest()]).then(([s, logo]) => { if (live) setSvg(addLogo(s, logo)); }, () => { if (live) setSvg(null); });
    return () => { live = false; };
  }, [url]);
  return svg;
}
/** Draws the finished SVG (code and crest) onto a canvas, for a PNG that drops into Canva, Word or a print shop.
 * A transparent SVG stays transparent: only a white one gets a white fill. */
async function svgToPng(svg: string, px: number, transparent = false): Promise<string> {
  const img = new Image();
  img.src = svgSrc(svg);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't make the PNG in this browser. Try the SVG.");
  if (!transparent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);
  }
  ctx.drawImage(img, 0, 0, px, px);
  return canvas.toDataURL("image/png");
}
const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function Promo() {
  const store = useStore();
  const toast = useToast();
  const canEdit = usePage("qr") === 2;
  const origin = useMemo(siteOrigin, []);
  const src = (file: string) => `${origin}/assets/generated/qr/${file}.svg`;
  const [mine, setMine] = useState<QrCode[] | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [editing, setEditing] = useState<Partial<QrCode> | null>(null);
  const [clear, setClear] = useState(() => { try { return localStorage.getItem("reavers-qr-transparent") === "1"; } catch { return false; } });
  const setTransparent = (on: boolean) => { setClear(on); try { localStorage.setItem("reavers-qr-transparent", on ? "1" : "0"); } catch { /* ignore */ } };
  // The website codes' SVG text, so they can be shown and saved without their background too.
  const [siteSvgs, setSiteSvgs] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    for (const c of CODES) void fetch(src(c.file)).then(r => (r.ok ? r.text() : null)).then(t => { if (live && t) setSiteSvgs(m => ({ ...m, [c.file]: t })); }, () => undefined);
    return () => { live = false; };
  }, [origin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reload() {
    try { setMine(await store.list("qr_codes")); setNotSetUp(false); }
    catch (e) { if (isMissingSetup(e)) setNotSetUp(true); else toast(errorText(e), true); setMine([]); }
  }
  useEffect(() => { void reload(); }, [store]); // eslint-disable-line react-hooks/exhaustive-deps

  const siteSvg = (file: string) => { const t = siteSvgs[file]; return t && clear ? makeTransparent(t) : t; };
  async function save(file: string, name: string, png = false) {
    try {
      const svg = siteSvg(file);
      if (!svg) throw new Error("Couldn't load that QR code. Check the connection and try again.");
      download(png ? await svgToPng(svg, 1200, clear) : svgSrc(svg), png ? name.replace(/\.svg$/, ".png") : name);
    } catch (e) {
      toast(errorText(e), true);
    }
  }

  async function remove(code: QrCode) {
    if (!confirm(`Delete the "${code.title}" QR code? Printed copies keep working, since they only hold the link.`)) return false;
    try { await store.remove("qr_codes", code.id); toast("Deleted"); await reload(); return true; }
    catch (e) { toast(errorText(e), true); return false; }
  }

  return (
    <Page title="QR codes" intro="For posters, tables at demos and flyers. Add your own for any link, like a tournament signup or a sponsor's page, then download it or print the sheet."
      actions={<>
        <label className="qr-toggle no-print"><input type="checkbox" checked={clear} onChange={e => setTransparent(e.target.checked)} /> Transparent background</label>
        {canEdit && !notSetUp && <button onClick={() => setEditing({})}>Add QR code</button>}
        <button className="primary" onClick={() => window.print()}>Print sheet</button>
      </>}>

      {clear && <p className="muted small no-print qr-clear-note">Downloads have no background, for laying over a poster or shirt. Put them on something light: phones need dark squares on a pale background.</p>}
      <div className="section qr-section">
        <div className="section-head"><h2>Club codes <small className="muted">your own links</small></h2></div>
        {notSetUp ? <p className="banner no-print">Adding your own QR codes needs one database update first (the <code>reavers_app_qr_codes</code> table). The website codes below still work.</p>
          : mine === null ? <Loading />
          : mine.length === 0 ? <Empty>No codes of your own yet. Use <strong>Add QR code</strong> to make one for any link.</Empty>
          : <div className="qr-grid">{mine.map(c => <CustomCard key={c.id} code={c} clear={clear} canEdit={canEdit} onEdit={() => setEditing(c)} />)}</div>}
      </div>

      <div className="section qr-section">
        <div className="section-head"><h2>Website codes <small className="muted">rebuilt every time the site is published</small></h2></div>
        <div className="qr-grid">
          {CODES.map(c => (
            <article key={c.file} className="card qr">
              <img className={clear ? "clear" : undefined} src={siteSvg(c.file) ? svgSrc(siteSvg(c.file)!) : src(c.file)} alt={`QR code: ${c.title}`} width="220" height="220" />
              <div>
                <strong>{c.title}</strong>
                <small className="muted block">{c.note}</small>
              </div>
              <div className="qr-actions no-print">
                <button onClick={() => void save(c.file, c.download)}>SVG</button>
                <button onClick={() => void save(c.file, c.download, true)}>PNG</button>
              </div>
            </article>))}
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit QR code" : "Add QR code"} onClose={() => setEditing(null)}>
          <QrForm initial={editing}
            onSaved={async () => { setEditing(null); await reload(); }}
            onDelete={editing.id ? async () => { if (await remove(editing as QrCode)) setEditing(null); } : undefined} />
        </Modal>)}
    </Page>
  );
}

function CustomCard({ code, clear, canEdit, onEdit }: { code: QrCode; clear: boolean; canEdit: boolean; onEdit: () => void }) {
  const toast = useToast();
  const full = useQrSvg(code.url);
  const svg = full && clear ? makeTransparent(full) : full;
  async function png() {
    try { if (svg) download(await svgToPng(svg, 1200, clear), `${qrFileName(code.title)}.png`); }
    catch (e) { toast(errorText(e), true); }
  }
  return (
    <article className="card qr">
      {svg ? <img className={clear ? "clear" : undefined} src={svgSrc(svg)} alt={`QR code: ${code.title}`} width="220" height="220" /> : <div className="qr-blank" aria-busy="true" />}
      <div>
        <strong>{code.title}</strong>
        {code.note && <small className="muted block">{code.note}</small>}
        <a className="qr-link" href={code.url} target="_blank" rel="noreferrer">{shortLink(code.url)}</a>
      </div>
      <div className="qr-actions no-print">
        <button disabled={!svg} onClick={() => svg && download(svgSrc(svg), `${qrFileName(code.title)}.svg`)}>SVG</button>
        <button disabled={!svg} onClick={() => void png()}>PNG</button>
        {canEdit && <button className="ghost" onClick={onEdit}>Edit</button>}
      </div>
    </article>
  );
}

function QrForm({ initial, onSaved, onDelete }: { initial: Partial<QrCode>; onSaved: () => Promise<void>; onDelete?: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [title, setTitle] = useState(initial.title || "");
  const [note, setNote] = useState(initial.note || "");
  const [link, setLink] = useState(initial.url || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cleaned = cleanLink(link);
  const preview = useQrSvg("url" in cleaned ? cleaned.url : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Give the code a name, so you know which poster it's for."); return; }
    if ("error" in cleaned) { setError(cleaned.error); return; }
    const row = { title: title.trim().slice(0, 80), note: note.trim().slice(0, 200) || null, url: cleaned.url };
    setError("");
    setBusy(true);
    try {
      if (initial.id) await store.update("qr_codes", initial.id, row);
      else await store.insert("qr_codes", row);
      toast("Saved");
      await onSaved();
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  }

  return (
    <form className="form qr-form" onSubmit={submit}>
      {!initial.id && (
        <div className="qr-quick">
          <span className="muted">Quick pick:</span>
          {QUICK_LINKS.map(q => (
            <button type="button" key={q.label} className="chip" onClick={() => { setLink(q.url); if (!title.trim()) setTitle(q.title); if (!note.trim()) setNote(q.note); }}>{q.label}</button>))}
        </div>)}
      <div className="qr-form-body">
        <div className="grid">
          <label className="wide"><span>Link it opens<b aria-hidden> *</b></span>
            <input type="text" inputMode="url" autoComplete="off" placeholder="https://…" value={link} onChange={e => setLink(e.target.value)} required />
            <small>Any web page: a Square checkout, a sign-up form, an event page.</small>
          </label>
          <label className="wide"><span>Name<b aria-hidden> *</b></span>
            <input type="text" maxLength={80} placeholder="e.g. Fight Night tickets" value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
          <label className="wide"><span>Note</span>
            <input type="text" maxLength={200} placeholder="Shown under the code, e.g. Scan to pay at the table" value={note} onChange={e => setNote(e.target.value)} />
          </label>
        </div>
        <div className="qr-preview" aria-live="polite">
          {preview ? <img src={svgSrc(preview)} alt="Preview of the QR code" /> : <p className="muted">{link.trim() ? "error" in cleaned ? cleaned.error : "…" : "The code shows here as you type the link."}</p>}
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
        <button type="submit" className="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

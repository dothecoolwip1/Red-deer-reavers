import { useState } from "react";
import { Link } from "react-router-dom";
import { SITE_URL } from "../../data/config";
import type { SquareItem } from "../../data/types";
import { KIND_LABEL } from "../../lib/square";
import { storeProblem } from "../../lib/store";
import { Empty, Loading, Modal, Money, Page, Pill, errorText, useAction, useStore, useTable, useToast } from "../../ui";

/** Tournament entries, visitor fees and dues are sold elsewhere (event sign-ups, the pay page), not in the merch store. */
const MERCH_KINDS: SquareItem["kind"][] = ["sticker", "trading_card", "other"];

export const STORE_URL = new URL("store.html", SITE_URL).href;

/**
 * Website → Merch store: which of the club's Square items show on reddeerreavers.com/store.html, and their photos.
 * Prices, names and new items are set where they always were (Pay the club → Manage what the club sells), so the card
 * reader, the open pay page and the store can't disagree. Treasury only (the items table is theirs to write).
 */
export function MerchStore() {
  const items = useTable("square_items");
  const store = useStore();
  const run = useAction();
  const [photoFor, setPhotoFor] = useState<SquareItem | null>(null);
  const rows = (items.rows || []).filter(i => MERCH_KINDS.includes(i.kind) || i.in_store).sort((a, b) => Number(b.in_store) - Number(a.in_store) || a.sort_order - b.sort_order);
  const needsUpdate = store.session.mode === "live" && (items.rows || []).some(i => i.in_store === undefined);
  const save = (item: SquareItem, patch: Partial<SquareItem>, done: string) =>
    run(() => store.update("square_items", item.id, patch), done).then(ok => { if (ok) void items.reload(); });

  return (
    <Page title="Merch store" intro={<>Choose which items show in the <a href={STORE_URL} target="_blank" rel="noopener noreferrer">website store</a> and give them a photo. Buyers pay through Square, so store sales show in Square sales and the Ledger under Merch, like the card reader's.</>}
      actions={<a className="button" href={STORE_URL} target="_blank" rel="noopener noreferrer">Open the store</a>}>
      {needsUpdate && <p className="banner">The store update isn't in the database yet (<code>20261111024000_reavers_app_merch_store.sql</code>). Until then the website store shows every sticker and trading card for sale, without photos, and these switches can't save.</p>}
      {!items.rows ? <Loading /> : rows.length === 0 ? <Empty>Nothing to sell yet. Add stickers or trading cards under <Link to="/pay">Pay the club → Manage what the club sells</Link>.</Empty> : (
        <div className="cards store-admin">
          {rows.map(item => {
            const problem = storeProblem(item);
            return (
              <article key={item.id} className={item.in_store ? "card" : "card off"}>
                <button type="button" className="store-thumb" onClick={() => setPhotoFor(item)} aria-label={`${item.image_url ? "Change" : "Add"} the photo for ${item.title}`}>
                  {item.image_url ? <img src={item.image_url} alt="" /> : <span>Add a photo</span>}
                </button>
                <div className="store-line">
                  <h2>{item.title}</h2>
                  <Money cents={item.price_cents} />
                </div>
                <p className="muted small">{KIND_LABEL[item.kind]}{item.max_quantity > 1 ? ` · up to ${item.max_quantity} per order` : ""}</p>
                <p>{item.in_store
                  ? problem ? <Pill tone="soon">In the store, but hidden: {problem}</Pill> : <Pill tone="done">Showing in the store</Pill>
                  : <Pill>Not in the store</Pill>}</p>
                <div className="form-actions">
                  <button type="button" className="ghost" onClick={() => setPhotoFor(item)}>{item.image_url ? "Change photo" : "Add photo"}</button>
                  {item.in_store
                    ? <button type="button" onClick={() => void save(item, { in_store: false }, `${item.title} is off the store`)}>Hide from store</button>
                    : <button type="button" className="primary" onClick={() => void save(item, { in_store: true }, `${item.title} is in the store`)}>Show in store</button>}
                </div>
              </article>);
          })}
        </div>)}
      <p className="muted small" style={{ marginTop: 18 }}>Change a price or name, or add something new, under <Link to="/pay">Pay the club → Manage what the club sells</Link>. An item shows in the store only while it's For sale and On the open page. Tournament entries, visitor fees and dues aren't listed here.</p>
      {photoFor && <PhotoModal item={photoFor} onClose={() => setPhotoFor(null)} onSave={async url => {
        await save(photoFor, { image_url: url }, url ? "Photo saved" : "Photo removed");
        setPhotoFor(null);
      }} />}
    </Page>
  );
}

function PhotoModal({ item, onClose, onSave }: { item: SquareItem; onClose: () => void; onSave: (url: string | null) => Promise<void> }) {
  const store = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`Photo: ${item.title}`} onClose={onClose}>
      {item.image_url && <img className="image-preview" src={item.image_url} alt="Current" />}
      <label className="drop">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) { toast("Photos must be under 8 MB.", true); return; }
          setBusy(true);
          try { await onSave(await store.uploadSiteImage(file)); } catch (err) { toast(errorText(err), true); }
          setBusy(false);
        }} />
        <strong>{busy ? "Uploading…" : item.image_url ? "Upload a new photo" : "Upload a photo"}</strong>
        <span className="muted small">JPEG, PNG, WebP or AVIF, under 8 MB. The store shows it 4:3 (a bit wider than tall), cropped to fit.</span>
      </label>
      {item.image_url && <div className="form-actions"><button type="button" className="ghost" onClick={() => void onSave(null)}>Remove photo</button></div>}
    </Modal>
  );
}

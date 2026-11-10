import { useState } from "react";
import type { CheckoutRequest, SquareItem } from "../data/types";
import { monthLabel } from "../lib/square";
import { Empty, Money } from "../ui";

const ym = (offset: number) => {
  const d = new Date();
  const m = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
};
export const duesMonths = () => [ym(-2), ym(-1), ym(0), ym(1), ym(2)];

/** The club's items as cards; pick one, say who you are, and go to Square's payment page. */
export function BuyCards({ items, who, returnUrl, checkout, note }: {
  items: SquareItem[]; who?: { name: string; email: string }; returnUrl: string; note?: string;
  checkout: (req: CheckoutRequest) => Promise<string>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) return <Empty>Nothing is for sale here yet.</Empty>;
  return (
    <div className="cards">
      {items.map(item => (
        <article key={item.id} className={open === item.id ? "card buy open" : "card buy"}>
          <p className="kicker">{KIND_KICKER[item.kind]}</p>
          <h2>{item.title}</h2>
          {item.description && <p className="muted">{item.description}</p>}
          <p className="big"><Money cents={item.price_cents} />{item.kind === "dues" ? <small className="muted"> / month</small> : item.max_quantity > 1 ? <small className="muted"> each</small> : null}</p>
          {open === item.id
            ? <BuyForm item={item} who={who} returnUrl={returnUrl} checkout={checkout} note={note} onCancel={() => setOpen(null)} />
            : <button className="primary" onClick={() => setOpen(item.id)}>{item.kind === "dues" ? "Pay dues" : item.kind === "tournament" ? "Register" : "Buy"}</button>}
        </article>))}
    </div>
  );
}

const KIND_KICKER: Record<SquareItem["kind"], string> = {
  tournament: "Tournament", visitor: "Events", sticker: "Merch", trading_card: "Merch", dues: "Members", other: "Club"
};

function BuyForm({ item, who, returnUrl, checkout, note, onCancel }: {
  item: SquareItem; who?: { name: string; email: string }; returnUrl: string; note?: string;
  checkout: (req: CheckoutRequest) => Promise<string>; onCancel: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState(who?.name || "");
  const [email, setEmail] = useState(who?.email || "");
  const [month, setMonth] = useState(ym(0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form className="form" onSubmit={async e => {
      e.preventDefault();
      setBusy(true);
      setError("");
      try {
        const url = await checkout({ item_id: item.id, quantity, buyer_name: name, buyer_email: email, dues_month: item.kind === "dues" ? month : null, return_url: returnUrl });
        window.location.assign(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setBusy(false);
      }
    }}>
      {item.max_quantity > 1 && (
        <label><span>How many</span>
          <select value={quantity} onChange={e => setQuantity(Number(e.target.value))}>
            {Array.from({ length: item.max_quantity }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>)}
      {item.kind === "dues" && (
        <label><span>For the month of</span>
          <select value={month} onChange={e => setMonth(e.target.value)}>
            {duesMonths().map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>)}
      <label><span>{item.kind === "tournament" ? "Fighter's name" : "Your name"}</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required /></label>
      <label><span>Email for the receipt</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button className="primary" disabled={busy}>{busy ? "Opening Square…" : <>Pay <Money cents={item.price_cents * quantity} /></>}</button>
      </div>
      <p className="muted small">{note || "You'll finish on Square's secure page: card, Apple Pay or Google Pay."}</p>
    </form>
  );
}

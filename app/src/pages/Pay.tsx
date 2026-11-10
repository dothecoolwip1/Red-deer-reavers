import { useLocation } from "react-router-dom";
import { KIND_LABEL, KINDS, monthLabel } from "../lib/square";
import { Money, Page, Pill, RecordList, useCan, useStore, useTable } from "../ui";
import { BuyCards } from "./BuyForm";

/** Where the open pay page lives, for posters, QR codes and the website. */
export const publicPayUrl = () => `${window.location.origin}${window.location.pathname}#/buy`;

export function Pay() {
  const store = useStore();
  const items = useTable("square_items");
  const dues = useTable("dues");
  const links = useTable("payment_links");
  const canEdit = useCan("money.edit");
  const paid = new URLSearchParams(useLocation().search).has("paid");
  const active = (items.rows || []).filter(i => i.active).sort((a, b) => a.sort_order - b.sort_order);
  const mine = (dues.rows || []).filter(d => d.member_user === store.session.userId);
  const oldLinks = (links.rows || []).filter(l => l.active);
  const returnUrl = `${window.location.href.split("#")[0]}#/pay?paid=1`;
  return (
    <Page title="Pay the club" intro="Dues, tournament registration, event entry, stickers and trading cards, all through Square: card, Apple Pay or Google Pay. Every payment lands in the club's books by itself. Prefer Interac e-Transfer? Send it to the club's autodeposit address with your name in the message, and treasury will mark it.">
      {paid && <p className="banner good">Thanks! Square has your payment. It shows up here and in the club's books within a minute.</p>}
      {items.rows && <BuyCards items={active} who={{ name: store.session.name, email: store.session.email }} returnUrl={returnUrl} checkout={req => store.checkout(req)} />}

      <section className="section" style={{ marginTop: 24 }}>
        <h2>Your dues</h2>
        {mine.length === 0 ? <p className="muted">No dues on record for you yet. Paid in cash or by e-Transfer? Treasury marks those by hand.</p> : (
          <ul className="tags">
            {mine.sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6).map(d => (
              <li key={d.id}><Pill tone="done">{monthLabel(d.month)} · {d.method === "waived" ? "waived" : "paid"}</Pill></li>))}
          </ul>)}
      </section>

      <p className="muted small">Not signed in? Visitors and fighters from other clubs can pay at <a href={publicPayUrl()}>the open pay page</a>; no account needed.</p>

      {canEdit && (
        <details className="manage">
          <summary>Manage what the club sells</summary>
          <p className="muted">These show above, and (if "On the open page" is ticked) on the open pay page for people without an account. For the card reader at the table, give the item the same name in the Square app so its sales are sorted the same way.</p>
          <RecordList table="square_items" noun="item" rows={items.rows} reload={items.reload} defaults={{ active: true, public: true, max_quantity: 1, sort_order: 0 }}
            fields={[
              { key: "title", label: "Name", required: true, wide: true, hint: "Use the same name as the item in the Square app" },
              { key: "kind", label: "What it is", type: "select", options: [...KINDS], hint: KINDS.map(k => `${k} = ${KIND_LABEL[k]}`).join(", ") },
              { key: "price_cents", label: "Price", type: "money", required: true },
              { key: "max_quantity", label: "Most per order", type: "number" },
              { key: "sort_order", label: "Order on the page", type: "number" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "public", label: "On the open page (no sign-in)", type: "checkbox" },
              { key: "active", label: "For sale", type: "checkbox" }
            ]}
            columns={[
              { label: "Name", render: i => i.title },
              { label: "What", render: i => KIND_LABEL[i.kind] },
              { label: "Price", render: i => <Money cents={i.price_cents} />, className: "num" },
              { label: "Shown", render: i => (!i.active ? "Hidden" : i.public ? "Everyone" : "Members") }
            ]} />
        </details>)}

      {oldLinks.length > 0 && (
        <details className="manage">
          <summary>Other payment links</summary>
          <ul className="list">{oldLinks.map(l => <li key={l.id}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a> <Money cents={l.amount_cents} /></li>)}</ul>
        </details>)}
    </Page>
  );
}

import { Empty, Loading, Money, Page, RecordList, useCan, useTable } from "../ui";

export function Pay() {
  const { rows, reload } = useTable("payment_links");
  const canEdit = useCan("money.edit");
  const active = (rows || []).filter(r => r.active);
  return (
    <Page title="Pay the club" intro="Card, Apple Pay and Google Pay through Stripe; every payment lands in the ledger by itself. Prefer Interac e-Transfer? Send it to the club's autodeposit address and put your name in the message.">
      {!rows ? <Loading /> : active.length === 0 ? <Empty>No payment options are set up yet.</Empty> : (
        <div className="cards">
          {active.map(p => (
            <article key={p.id} className="card">
              <h2>{p.title}</h2>
              {p.description && <p>{p.description}</p>}
              <p className="big">{p.amount_cents ? <Money cents={p.amount_cents} /> : "Any amount"}</p>
              <a className="button primary" href={p.url} target="_blank" rel="noopener noreferrer">Pay now</a>
            </article>))}
        </div>)}
      {canEdit && (
        <details className="manage">
          <summary>Manage payment links</summary>
          <p className="muted">Create a Payment Link in the Stripe dashboard (Payment Links → New), copy its https://buy.stripe.com/… address and add it here.</p>
          <RecordList table="payment_links" noun="payment link" rows={rows} reload={reload} defaults={{ active: true }}
            fields={[
              { key: "title", label: "Title", required: true, wide: true },
              { key: "url", label: "Stripe Payment Link", type: "url", required: true, wide: true },
              { key: "amount_cents", label: "Amount (blank = any)", type: "money" },
              { key: "kind", label: "Kind", type: "select", options: ["dues", "entry", "sponsorship", "donation", "merch", "other"] },
              { key: "description", label: "Description", type: "textarea" },
              { key: "active", label: "Show to members", type: "checkbox" }
            ]}
            columns={[{ label: "Title", render: p => p.title }, { label: "Kind", render: p => p.kind }, { label: "Amount", render: p => <Money cents={p.amount_cents} />, className: "num" }, { label: "Shown", render: p => (p.active ? "Yes" : "No") }]} />
        </details>)}
    </Page>
  );
}

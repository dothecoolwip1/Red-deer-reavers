import { useEffect, useState } from "react";
import { SITE_URL } from "../data/config";
import { isMissingSetup, publicItems, startCheckout } from "../data/supabase";
import type { SquareItem } from "../data/types";
import { Loading } from "../ui";
import { BuyCards } from "./BuyForm";

/**
 * The open pay page (app/#/buy): tournament registration, visitor fees, stickers and trading cards for anyone, no
 * account needed. Members-only items (dues) aren't listed here.
 */
export function Buy() {
  const [items, setItems] = useState<SquareItem[] | null>(null);
  const [problem, setProblem] = useState("");
  const paid = /[?&]paid=/.test(window.location.hash);
  useEffect(() => {
    document.title = "Pay the Reavers";
    publicItems().then(setItems, e => { setItems([]); setProblem(isMissingSetup(e) ? "Online payments aren't switched on yet. Pay at the table with card or cash." : "Couldn't load what's for sale. Try again in a minute, or pay at the table."); });
  }, []);
  return (
    <div className="public-pay">
      <header className="public-head">
        <a className="brand" href={SITE_URL}><img src={`${import.meta.env.BASE_URL}crest.png`} alt="" width="40" height="40" /> Red Deer Reavers</a>
      </header>
      <section className="page">
        <header className="page-head"><div>
          <h1>Pay the Reavers</h1>
          <p className="intro">Register for a tournament, pay your way into an event, or grab stickers and fighter trading cards. Card, Apple Pay or Google Pay, through Square.</p>
        </div></header>
        {paid && <p className="banner good">Thanks! Your payment went through. Square has emailed your receipt; show it at the table if you're asked.</p>}
        {problem && <p className="banner">{problem}</p>}
        {!items ? <Loading /> : <BuyCards items={items} returnUrl={`${window.location.href.split("#")[0]}#/buy?paid=1`} checkout={startCheckout} />}
        <p className="muted small" style={{ marginTop: 24 }}>Reavers member paying dues? <a href={`${window.location.href.split("#")[0]}#/pay`}>Sign in to the app</a> so they're filed under your name.</p>
      </section>
    </div>
  );
}

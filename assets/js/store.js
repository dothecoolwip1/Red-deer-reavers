/*
 * The merch store (store.html).
 * Reads what's for sale from the Reavers app's Square items (reavers_app_square_items: for sale, on the open page and
 * "In the website store"), and sends each order to the app's reavers-square-checkout function, the same one the app's
 * pay page uses. The buyer pays on Square's own page and comes back here with ?paid=1; the Square webhook files the sale
 * in the app (Square sales, Ledger → Merch). Text from the database is always set as text, never as HTML.
 */
(() => {
  const grid = document.querySelector("[data-store-items]");
  if (!grid) return;
  const CFG = (window.BUHURTOS && window.BUHURTOS.config) || {};
  const API = CFG.url || "https://api-home.buhurtoshome.app";
  const KEY = CFG.key || "";
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const empty = document.querySelector("[data-store-empty]");
  const params = new URLSearchParams(location.search);
  const money = cents => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
  const KICKER = { sticker: "Stickers", trading_card: "Trading cards", other: "Merch" };
  const SAFE_IMG = /^https:\/\/[^\s"'<>]+$/i;

  if (params.has("paid")) {
    const paid = document.querySelector("[data-store-paid]");
    if (paid) { paid.hidden = false; paid.scrollIntoView({ block: "center" }); }
    history.replaceState(null, "", location.pathname);
  }

  const FIELDS = "id,title,kind,description,price_cents,max_quantity,image_url,sort_order";
  const base = `${API}/rest/v1/reavers_app_square_items?active=eq.true&public=eq.true&order=sort_order.asc,title.asc`;
  async function load() {
    const res = await fetch(`${base}&in_store=eq.true&select=${FIELDS}`, { headers });
    if (res.ok) return res.json();
    // Before the store update reaches the database (no in_store/image_url columns yet): show the stickers and cards.
    if (res.status === 400) {
      const old = await fetch(`${base}&kind=in.(sticker,trading_card)&select=id,title,kind,description,price_cents,max_quantity,sort_order`, { headers });
      if (old.ok) return old.json();
    }
    throw new Error(`store ${res.status}`);
  }

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  function card(item) {
    const art = el("div", "store-art");
    if (item.image_url && SAFE_IMG.test(item.image_url)) {
      const img = el("img");
      img.src = item.image_url;
      img.alt = item.title;
      img.loading = "lazy";
      img.decoding = "async";
      art.append(img);
    } else {
      art.classList.add("placeholder");
      const img = el("img");
      img.src = "assets/crest-256.webp";
      img.alt = "";
      img.width = 128;
      img.height = 128;
      art.append(img);
    }
    const body = el("div", "store-body");
    body.append(el("p", "eyebrow", KICKER[item.kind] || "Merch"), el("h3", "", item.title));
    if (item.description) body.append(el("p", "store-desc", item.description));
    const price = el("p", "store-price", money(item.price_cents));
    if (item.max_quantity > 1) price.append(el("small", "", " each"));
    body.append(price, form(item));
    const article = el("article", "plate store-item");
    article.append(art, body);
    return article;
  }

  let uid = 0;
  function form(item) {
    const f = el("form", "form store-form");
    const n = ++uid;
    const field = (label, input) => { const l = el("label"); l.append(label, input); return l; };
    let qty = null;
    if (item.max_quantity > 1) {
      qty = el("select");
      qty.name = "quantity";
      for (let i = 1; i <= Math.min(item.max_quantity, 50); i++) { const o = el("option", "", String(i)); o.value = String(i); qty.append(o); }
    }
    const name = el("input"); name.name = "name"; name.autocomplete = "name"; name.maxLength = 120; name.id = `store-name-${n}`;
    const email = el("input"); email.type = "email"; email.name = "email"; email.autocomplete = "email"; email.maxLength = 200;
    const who = el("div", "store-who");
    who.hidden = true;
    who.append(field("Your name", name), field("Email for the receipt", email));
    const status = el("p", "form-status");
    status.setAttribute("aria-live", "polite");
    const button = el("button", "btn btn-ember btn-block");
    button.type = "submit";
    const label = () => `Buy${qty && Number(qty.value) > 1 ? ` ${qty.value}` : ""} · ${money(item.price_cents * Number(qty ? qty.value : 1))}`;
    button.textContent = label();
    if (qty) { qty.addEventListener("change", () => { button.textContent = who.hidden ? label() : `Pay ${money(item.price_cents * Number(qty.value))} on Square`; }); f.append(field("How many", qty)); }
    f.append(who, button, status);

    f.addEventListener("submit", async event => {
      event.preventDefault();
      if (who.hidden) {
        // First press opens the name and email fields; the second goes to Square.
        // Required only once they're showing, or the browser blocks the first press on fields it can't show.
        who.hidden = false;
        name.required = true;
        email.required = true;
        button.textContent = `Pay ${money(item.price_cents * Number(qty ? qty.value : 1))} on Square`;
        status.textContent = "You'll finish on Square's secure page.";
        name.focus();
        return;
      }
      button.disabled = true;
      const before = button.textContent;
      button.textContent = "Opening Square…";
      status.textContent = "";
      try {
        const res = await fetch(`${API}/functions/v1/reavers-square-checkout`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: item.id, quantity: Number(qty ? qty.value : 1), buyer_name: name.value.trim(), buyer_email: email.value.trim(),
            return_url: `${location.origin}${location.pathname}?paid=1`
          })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.url) throw new Error(out.error || "Square didn't start the checkout. Try again in a minute, or buy at the merch table.");
        location.assign(out.url);
      } catch (err) {
        status.textContent = err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Couldn't reach Square. Try again in a minute, or buy at the merch table.";
        button.disabled = false;
        button.textContent = before;
      }
    });
    return f;
  }

  load().then(items => {
    grid.replaceChildren(...items.map(card));
    if (!items.length && empty) empty.hidden = false;
  }).catch(() => {
    grid.replaceChildren();
    if (empty) empty.hidden = false;
  }).finally(() => grid.setAttribute("aria-busy", "false"));
})();

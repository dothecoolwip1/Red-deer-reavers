/*
 * Site editor support for the public pages.
 *
 * 1. Applies text and image changes the executive published from the Reavers app (Site editor), read from the
 *    BuhurtOS table reavers_app_site_content. Text is set with textContent only, never as HTML.
 * 2. When a page is opened inside the app's editor (?reavers-edit=1 in an iframe), it turns on click-to-edit and talks to
 *    the editor with postMessage. Edits stay drafts in the app until someone presses Publish there.
 *
 * Every piece of text is found automatically and named by its page plus a fingerprint of its original wording, so pages
 * need no markup. If a developer later rewrites that text in the code, the old edit stops applying and the new text shows.
 */
(() => {
  const CFG = (window.BUHURTOS && window.BUHURTOS.config) || {};
  const API = CFG.url || "https://api-home.buhurtoshome.app";
  const KEY = CFG.key || "";
  const EDITOR_ORIGINS = [location.origin, "https://app.reddeerreavers.com", "https://reddeerreavers.com", "http://localhost:5173", "http://127.0.0.1:5173"];
  const params = new URLSearchParams(location.search);
  const editing = params.has("reavers-edit") && window.parent !== window;
  const page = (location.pathname.split("/").pop() || "index.html").replace(/^$/, "index.html");
  const CACHE = `rv-site-content:${page}`;

  const DECOR = new Set(["SVG", "BR", "IMG", "PICTURE"]);
  const SKIP = "script,style,noscript,template,textarea,select,input,option,[aria-hidden='true'],.sr-only,.marquee,[contenteditable]";
  const ALLOWED_DATA = /^data-(reveal|delay|rv-.*)$/;

  const norm = s => s.replace(/\s+/g, " ").trim();
  const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
  const dynamic = el => { for (let n = el; n && n !== document.body; n = n.parentElement) { for (const a of n.attributes) if (a.name.startsWith("data-") && !ALLOWED_DATA.test(a.name)) return true; } return false; };
  const directText = el => [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim());

  /** Text units: elements with their own words, whose child elements are only icons or line breaks. */
  function findUnits() {
    const units = new Map();
    const add = (key, unit) => { if (!units.has(key)) units.set(key, []); units.get(key).push(unit); };
    const roots = [...document.querySelectorAll("main, footer")];
    for (const root of roots) {
      for (const el of root.querySelectorAll("*")) {
        if (el.closest(SKIP) || dynamic(el)) continue;
        if (el.tagName === "IMG") {
          const src = el.getAttribute("src");
          if (src && !src.startsWith("data:")) add(`img:${hash(src)}`, { kind: "image", el, original: src, label: el.getAttribute("alt") || "Image" });
          continue;
        }
        const texts = directText(el);
        if (!texts.length) continue;
        if ([...el.children].some(c => !DECOR.has(c.tagName.toUpperCase()) && !(c.tagName === "I" && !c.textContent.trim()))) continue;
        const original = norm(texts.map(t => t.nodeValue).join(" "));
        if (original.length < 2) continue;
        add(`txt:${hash(original)}`, { kind: "text", el, original, label: el.tagName.toLowerCase() });
      }
    }
    return units;
  }

  const units = findUnits();

  function setText(unit, value) {
    const texts = directText(unit.el).length ? directText(unit.el) : [...unit.el.childNodes].filter(n => n.nodeType === 3);
    const text = value == null ? unit.original : String(value);
    if (!texts.length) { unit.el.appendChild(document.createTextNode(text)); return; }
    const first = texts[0];
    const lead = /^\s/.test(first.nodeValue) ? " " : "";
    const last = texts[texts.length - 1];
    const trail = /\s$/.test(last.nodeValue) ? " " : "";
    first.nodeValue = lead + text + (texts.length === 1 ? trail : "");
    texts.slice(1).forEach((t, i) => { t.nodeValue = i === texts.length - 2 ? trail : ""; });
  }

  const safeSrc = v => /^(https:\/\/|\/(?!\/)|[\w.-]+\/)/i.test(v) || (editing && /^(data:image\/|blob:)/i.test(v));
  function setImage(unit, value) {
    const src = value == null ? unit.original : String(value);
    if (!safeSrc(src)) return;
    unit.el.setAttribute("src", src);
    if (value != null) {
      unit.el.removeAttribute("srcset");
      if (unit.el.parentElement && unit.el.parentElement.tagName === "PICTURE") unit.el.parentElement.querySelectorAll("source").forEach(s => s.remove());
    }
  }

  function apply(key, value) {
    for (const unit of units.get(key) || []) (unit.kind === "image" ? setImage : setText)(unit, value);
  }

  function applyAll(rows) {
    for (const row of rows || []) if (row && units.has(row.key)) apply(row.key, row.value);
  }

  // Published changes: cached copy first (no flash on repeat visits), then the live copy.
  try { applyAll(JSON.parse(localStorage.getItem(CACHE) || "[]")); } catch (_) { /* storage blocked */ }
  if (KEY && !params.has("reavers-original")) {
    fetch(`${API}/rest/v1/reavers_app_site_content?select=key,value&page=eq.${encodeURIComponent(page)}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    }).then(r => (r.ok ? r.json() : null)).then(rows => {
      if (!Array.isArray(rows)) return;
      applyAll(rows);
      try { localStorage.setItem(CACHE, JSON.stringify(rows)); } catch (_) { /* ignore */ }
      if (editing) send({ type: "rv-published", page, rows });
    }).catch(() => { /* offline: the page's own text stays */ });
  }

  if (!editing) return;

  // ------------------------------------------------------------------ click-to-edit inside the app's editor
  let parentOrigin = "*";
  try { if (document.referrer) parentOrigin = new URL(document.referrer).origin; } catch (_) { /* keep * */ }
  function send(message) { window.parent.postMessage(message, parentOrigin); }

  document.documentElement.classList.add("rv-editing");
  const style = document.createElement("style");
  style.textContent = `
    .rv-editing [data-reveal] { opacity: 1 !important; transform: none !important; }
    [data-rv-unit] { outline: 1px dashed rgba(214,168,76,.45); outline-offset: 3px; cursor: text; transition: outline-color .15s; }
    img[data-rv-unit] { cursor: pointer; }
    [data-rv-unit]:hover { outline: 2px solid #d6a84c; }
    [data-rv-unit][data-rv-changed] { outline: 2px solid #7442b4; }
    [data-rv-active] { outline: 2px solid #ff7b1c !important; background: rgba(255,123,28,.08); }
    [data-rv-flash] { animation: rv-flash 1.2s ease 2; }
    @keyframes rv-flash { 50% { outline-color: #ff7b1c; outline-width: 4px; } }
    [data-rv-edit] { outline: none; caret-color: #ff7b1c; white-space: pre-wrap; }
  `;
  document.head.appendChild(style);

  const byEl = new Map();
  for (const [key, list] of units) for (const unit of list) { unit.el.setAttribute("data-rv-unit", key); byEl.set(unit.el, { key, unit }); }

  function begin(el) {
    const found = byEl.get(el);
    if (!found) return;
    const { key, unit } = found;
    if (unit.kind === "image") { send({ type: "rv-pick-image", page, key, src: el.getAttribute("src"), original: unit.original, alt: unit.label }); return; }
    if (el.querySelector("[data-rv-edit]")) return;
    const texts = directText(el);
    const span = document.createElement("span");
    span.setAttribute("data-rv-edit", "");
    span.textContent = norm(texts.map(t => t.nodeValue).join(" "));
    try { span.contentEditable = "plaintext-only"; } catch (_) { span.contentEditable = "true"; }
    if (span.contentEditable !== "plaintext-only") span.contentEditable = "true";
    const lead = texts[0] && /^\s/.test(texts[0].nodeValue) ? " " : "";
    texts.forEach((t, i) => { if (i === 0) { t.nodeValue = lead; t.after(span); } else t.nodeValue = ""; });
    el.setAttribute("data-rv-active", "");
    span.focus();
    const range = document.createRange(); range.selectNodeContents(span); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    send({ type: "rv-select", page, key });
    const finish = () => {
      const value = span.textContent.replace(/\s+/g, " ").trim();
      span.replaceWith(document.createTextNode(value));
      el.normalize();
      el.removeAttribute("data-rv-active");
      for (const other of units.get(key) || []) if (other.el !== el) setText(other, value);
      send({ type: "rv-change", page, key, kind: "text", value, original: unit.original });
    };
    span.addEventListener("blur", finish, { once: true });
    span.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); if (e.key === "Escape") span.textContent = norm(span.dataset.before || span.textContent); span.blur(); }
    });
    span.dataset.before = span.textContent;
    span.addEventListener("input", () => send({ type: "rv-typing", page, key, value: span.textContent }));
    span.addEventListener("paste", e => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain")); });
  }

  // Every click edits instead of navigating; the editor's page menu changes pages.
  document.addEventListener("click", e => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest("[data-rv-edit]")) return;
    const unit = target.closest("[data-rv-unit]");
    if (target.closest("a, button, form, label") || unit) { e.preventDefault(); e.stopPropagation(); }
    if (unit) begin(unit);
  }, true);
  document.addEventListener("submit", e => e.preventDefault(), true);

  window.addEventListener("message", e => {
    if (!EDITOR_ORIGINS.includes(e.origin) || !e.data || typeof e.data !== "object") return;
    const m = e.data;
    if (m.type === "rv-apply" && typeof m.key === "string") {
      apply(m.key, m.value);
      for (const unit of units.get(m.key) || []) unit.el.toggleAttribute("data-rv-changed", m.value != null && m.value !== unit.original);
    } else if (m.type === "rv-highlight" && typeof m.key === "string") {
      const unit = (units.get(m.key) || [])[0];
      if (unit) { unit.el.scrollIntoView({ behavior: "smooth", block: "center" }); unit.el.setAttribute("data-rv-flash", ""); setTimeout(() => unit.el.removeAttribute("data-rv-flash"), 2600); }
    }
  });

  send({
    type: "rv-ready", page, title: document.title,
    units: [...units].map(([key, list]) => ({ key, kind: list[0].kind, original: list[0].original, label: list[0].label, count: list.length }))
  });
})();

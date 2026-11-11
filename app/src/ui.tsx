import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Store, TableName, Tables } from "./data/types";
import { formatMoney, parseMoney } from "./lib/money";
import { can, type Action } from "./lib/roles";
import type { Level, PageId } from "./lib/pages";

// ------------------------------------------------------------------ store + toasts

const StoreContext = createContext<Store | null>(null);
export const StoreProvider = StoreContext.Provider;
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
export const useCan = (action: Action) => can(useStore().session.role, action);
/** What the signed-in person can do on a staff page: 0 hidden, 1 view only, 2 full use. */
export const usePage = (page: PageId): Level => useStore().session.pages[page] ?? 0;

type Toast = { id: number; text: string; bad?: boolean };
const ToastContext = createContext<(text: string, bad?: boolean) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);
export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, bad = false) => {
    const t = { id: Date.now() + Math.random(), text, bad };
    setToasts(list => [...list, t]);
    setTimeout(() => setToasts(list => list.filter(x => x.id !== t.id)), bad ? 6000 : 2800);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={t.bad ? "toast bad" : "toast"}>{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

/** Loads a table and reloads it on demand; errors go to a toast. */
export function useTable<T extends TableName>(table: T) {
  const store = useStore();
  const toast = useToast();
  const [rows, setRows] = useState<Tables[T][] | null>(null);
  const reload = useCallback(async () => {
    try { setRows(await store.list(table)); } catch (e) { toast(errorText(e), true); setRows([]); }
  }, [store, table, toast]);
  useEffect(() => { void reload(); }, [reload]);
  return { rows, reload };
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Runs an action, toasts the result, and reports failures without throwing. */
export function useAction() {
  const toast = useToast();
  return useCallback(async (fn: () => Promise<unknown>, done?: string) => {
    try { await fn(); if (done) toast(done); return true; } catch (e) { toast(errorText(e), true); return false; }
  }, [toast]);
}

// ------------------------------------------------------------------ small pieces

export const Money = ({ cents, signed }: { cents: number | null | undefined; signed?: boolean }) =>
  cents === null || cents === undefined ? <span className="muted">-</span>
    : <span className={signed ? (cents < 0 ? "money out" : "money in") : "money"}>{formatMoney(cents)}</span>;

export function Page({ title, intro, actions, children }: { title: string; intro?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  useEffect(() => { document.title = `${title} · Reavers app`; }, [title]);
  return (
    <section className="page">
      <header className="page-head">
        <div><h1>{title}</h1>{intro && <p className="intro">{intro}</p>}</div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export const Loading = () => <p className="muted" aria-busy="true">Loading…</p>;
export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;
export const Pill = ({ tone, children }: { tone?: string; children: ReactNode }) => <span className={`pill ${tone || ""}`}>{children}</span>;

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dateLabel = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : "";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="ghost" onClick={onClose} aria-label="Close">✕</button></header>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ forms

export type Field = {
  key: string; label: string; type?: "text" | "textarea" | "date" | "money" | "number" | "select" | "checkbox" | "email" | "url" | "time";
  options?: string[]; required?: boolean; hint?: string; wide?: boolean;
};

const toInput = (f: Field, v: unknown) =>
  f.type === "money" ? (v === null || v === undefined ? "" : (Number(v) / 100).toFixed(2)) : f.type === "checkbox" ? Boolean(v) : v ?? "";

/** A plain form over a record; money fields are typed in dollars and saved as cents. */
export function RecordForm({ fields, initial, onSubmit, submitLabel = "Save", onDelete }: {
  fields: Field[]; initial?: Record<string, unknown>; submitLabel?: string;
  onSubmit: (values: Record<string, unknown>) => Promise<boolean | void>; onDelete?: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map(f => [f.key, toInput(f, initial?.[f.key] ?? (f.type === "select" ? f.options?.[0] : undefined))])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setValues(prev => ({ ...prev, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.key];
      if (f.type === "money") {
        const cents = parseMoney(String(raw ?? ""));
        if (raw !== "" && cents === null) { setError(`${f.label}: enter an amount like 125.50`); return; }
        out[f.key] = cents;
      } else if (f.type === "number") out[f.key] = raw === "" ? null : Number(raw);
      else if (f.type === "checkbox") out[f.key] = Boolean(raw);
      else out[f.key] = typeof raw === "string" && raw.trim() === "" ? null : typeof raw === "string" ? raw.trim() : raw;
      if (f.required && (out[f.key] === null || out[f.key] === undefined)) { setError(`${f.label} is required`); return; }
    }
    setError("");
    setBusy(true);
    await onSubmit(out);
    setBusy(false);
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="grid">
        {fields.map(f => (
          <label key={f.key} className={f.wide || f.type === "textarea" ? "wide" : f.type === "checkbox" ? "check" : ""}>
            {f.type === "checkbox"
              ? <><input type="checkbox" checked={Boolean(values[f.key])} onChange={e => set(f.key, e.target.checked)} /> {f.label}</>
              : <>
                  <span>{f.label}{f.required && <b aria-hidden> *</b>}</span>
                  {f.type === "textarea" ? <textarea rows={3} value={String(values[f.key] ?? "")} onChange={e => set(f.key, e.target.value)} />
                    : f.type === "select" ? (
                      <select value={String(values[f.key] ?? "")} onChange={e => set(f.key, e.target.value)}>
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>)
                    : <input
                        type={f.type === "money" ? "text" : f.type === "number" ? "number" : f.type || "text"}
                        inputMode={f.type === "money" ? "decimal" : undefined}
                        placeholder={f.type === "money" ? "0.00" : undefined}
                        required={f.required}
                        value={String(values[f.key] ?? "")}
                        onChange={e => set(f.key, e.target.value)} />}
                  {f.hint && <small>{f.hint}</small>}
                </>}
          </label>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
        <button type="submit" className="primary" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ generic record screens

export type Column<R> = { label: string; render: (row: R) => ReactNode; className?: string };

/** A searchable table of records with add, edit and delete in a dialog, for the simple record types. */
export function RecordList<T extends TableName>({ table, rows, reload, fields, columns, noun, editable = true, filter, extraActions, defaults }: {
  table: T; rows: Tables[T][] | null; reload: () => Promise<void>; fields: Field[]; columns: Column<Tables[T]>[]; noun: string;
  editable?: boolean; filter?: (row: Tables[T], q: string) => boolean; extraActions?: (row: Tables[T]) => ReactNode;
  defaults?: Partial<Tables[T]>;
}) {
  const store = useStore();
  const run = useAction();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Tables[T] | "new" | null>(null);
  const shown = useMemo(() => (rows || []).filter(r => !q || (filter ? filter(r, q.toLowerCase()) : JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))), [rows, q, filter]);
  if (!rows) return <Loading />;
  const current = editing && editing !== "new" ? (editing as unknown as Record<string, unknown>) : undefined;
  return (
    <>
      <div className="toolbar">
        <input type="search" placeholder={`Search ${noun}s`} value={q} onChange={e => setQ(e.target.value)} aria-label={`Search ${noun}s`} />
        {editable && <button className="primary" onClick={() => setEditing("new")}>Add {noun}</button>}
      </div>
      {shown.length === 0 ? <Empty>No {noun}s yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map(c => <th key={c.label} className={c.className}>{c.label}</th>)}{(editable || extraActions) && <th aria-label="Actions" />}</tr></thead>
            <tbody>
              {shown.map(row => (
                <tr key={(row as { id: string }).id}>
                  {columns.map(c => <td key={c.label} className={c.className} data-label={c.label}>{c.render(row)}</td>)}
                  {(editable || extraActions) && (
                    <td className="row-actions">
                      {extraActions?.(row)}
                      {editable && <button className="ghost" onClick={() => setEditing(row)}>Edit</button>}
                    </td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing === "new" ? `Add ${noun}` : `Edit ${noun}`} onClose={() => setEditing(null)}>
          <RecordForm
            fields={fields}
            initial={current ?? (defaults as Record<string, unknown> | undefined)}
            onSubmit={async values => {
              const ok = await run(async () => {
                if (editing === "new") await store.insert(table, { ...(defaults || {}), ...values } as Partial<Tables[T]>);
                else await store.update(table, (editing as { id: string }).id, values as Partial<Tables[T]>);
              }, "Saved");
              if (ok) { setEditing(null); await reload(); }
            }}
            onDelete={editing === "new" ? undefined : async () => {
              if (!confirm(`Delete this ${noun}?`)) return;
              if (await run(() => store.remove(table, (editing as { id: string }).id), "Deleted")) { setEditing(null); await reload(); }
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const cell = (v: string | number | null) => { const s = v === null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob([rows.map(r => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

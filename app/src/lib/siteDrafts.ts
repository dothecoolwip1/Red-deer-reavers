/** Unpublished site-editor changes. A draft value of null means "put the original wording or picture back". */
export type Kind = "text" | "image";
export type Draft = { page: string; key: string; kind: Kind; value: string | null; original: string };
export type Drafts = Record<string, Draft>;
type Published = { id: string; page: string; key: string; kind: Kind; value: string; original: string };
type Unit = { page: string; key: string; original: string };

export const draftKey = (page: string, key: string) => `${page}|${key}`;

const live = (published: Published[], page: string, key: string) => published.find(p => p.page === page && p.key === key);

/** What the page shows with the drafts applied. */
export function effectiveValue(drafts: Drafts, published: Published[], unit: Unit): string {
  const draft = drafts[draftKey(unit.page, unit.key)];
  if (draft) return draft.value ?? unit.original;
  return live(published, unit.page, unit.key)?.value ?? unit.original;
}

export function withChange(drafts: Drafts, published: Published[], change: Unit & { kind: Kind; value: string }): Drafts {
  const value = change.kind === "text" ? change.value.replace(/\s+/g, " ").trim() : change.value.trim();
  if (!value) return drafts;
  const id = draftKey(change.page, change.key);
  const { [id]: _old, ...rest } = drafts;
  const current = live(published, change.page, change.key)?.value ?? change.original;
  if (value === current) return rest;
  const back = value === change.original;
  return { ...rest, [id]: { page: change.page, key: change.key, kind: change.kind, original: change.original, value: back ? null : value } };
}

/** Explicitly put an item back to its original (a no-op draft is dropped). */
export function withReset(drafts: Drafts, published: Published[], unit: Unit & { kind: Kind }): Drafts {
  const id = draftKey(unit.page, unit.key);
  const { [id]: _old, ...rest } = drafts;
  return live(published, unit.page, unit.key) ? { ...rest, [id]: { ...unit, value: null } } : rest;
}

export function publishPlan(drafts: Drafts, published: Published[]) {
  const inserts: Omit<Published, "id">[] = [];
  const updates: { id: string; value: string }[] = [];
  const removes: string[] = [];
  for (const d of Object.values(drafts)) {
    const row = live(published, d.page, d.key);
    if (d.value === null) { if (row) removes.push(row.id); }
    else if (row) updates.push({ id: row.id, value: d.value });
    else inserts.push({ page: d.page, key: d.key, kind: d.kind, value: d.value, original: d.original });
  }
  return { inserts, updates, removes };
}

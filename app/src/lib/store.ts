import type { SquareItem } from "../data/types";

/** Why an item marked "in the store" still wouldn't show on the website store, in words for treasury, or null. */
export function storeProblem(item: Pick<SquareItem, "active" | "public" | "kind" | "price_cents">): string | null {
  if (item.kind === "dues") return "dues are for members only";
  if (!item.active) return "it isn't marked For sale";
  if (!item.public) return "it's for signed-in members only";
  if (!(item.price_cents > 0)) return "it has no price";
  return null;
}

/** What the website store lists (the same filter assets/js/store.js asks the database for), in page order. */
export const storeItems = <T extends SquareItem>(items: T[]): T[] =>
  items.filter(i => i.in_store && !storeProblem(i)).sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

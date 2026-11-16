import { describe, expect, it } from "vitest";
import type { SquareItem } from "../data/types";
import { storeItems, storeProblem } from "./store";

const item = (over: Partial<SquareItem> = {}): SquareItem => ({
  id: over.title || "x", title: "Reavers sticker", kind: "sticker", description: null, price_cents: 300, max_quantity: 20,
  public: true, active: true, sort_order: 0, in_store: true, image_url: null, ...over
});

describe("merch store", () => {
  it("shows items that are in the store, for sale and open to everyone", () => {
    expect(storeProblem(item())).toBeNull();
    expect(storeProblem(item({ active: false }))).toMatch(/For sale/);
    expect(storeProblem(item({ public: false }))).toMatch(/members/);
    expect(storeProblem(item({ kind: "dues" }))).toMatch(/dues/);
  });
  it("lists only what the store shows, in page order", () => {
    const list = storeItems([
      item({ title: "Cards", sort_order: 2 }), item({ title: "Sticker", sort_order: 1 }), item({ title: "2-pack", sort_order: 1 }),
      item({ title: "Hidden", in_store: false }), item({ title: "Off", active: false }), item({ title: "Dues", kind: "dues", public: false })
    ]);
    expect(list.map(i => i.title)).toEqual(["2-pack", "Sticker", "Cards"]);
  });
});

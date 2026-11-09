import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney } from "./money";

describe("parseMoney", () => {
  it("reads plain, signed, currency and thousands", () => {
    expect(parseMoney("12")).toBe(1200);
    expect(parseMoney("1,234.56")).toBe(123456);
    expect(parseMoney("-$12.05")).toBe(-1205);
    expect(parseMoney("$ 0.1")).toBe(10);
  });
  it("reads accounting negatives in brackets", () => {
    expect(parseMoney("(45.00)")).toBe(-4500);
  });
  it("returns null for blanks and junk", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats cents as Canadian dollars", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(-1205)).toBe("-$12.05");
    expect(formatMoney(0)).toBe("$0.00");
  });
});

import { describe, expect, it } from "vitest";
import { cleanLink, qrFileName, shortLink } from "./qr";
import { makeTransparent, qrSvg } from "./qr-svg";

describe("cleanLink", () => {
  it("keeps full web links", () => {
    expect(cleanLink(" https://app.reddeerreavers.com/#/buy ")).toEqual({ url: "https://app.reddeerreavers.com/#/buy" });
    expect(cleanLink("http://example.com/a?b=1")).toEqual({ url: "http://example.com/a?b=1" });
  });
  it("adds https:// when it's left off", () => {
    expect(cleanLink("reddeerreavers.com/events.html")).toEqual({ url: "https://reddeerreavers.com/events.html" });
  });
  it("refuses anything that isn't a web link", () => {
    expect(cleanLink("javascript:alert(1)")).toHaveProperty("error");
    expect(cleanLink("mailto:a@b.ca")).toHaveProperty("error");
    expect(cleanLink("")).toHaveProperty("error");
    expect(cleanLink("not a link")).toHaveProperty("error");
    expect(cleanLink("hello")).toHaveProperty("error");
  });
});

describe("qrFileName", () => {
  it("makes a tidy file name", () => {
    expect(qrFileName("Fight Night tickets!")).toBe("reavers-fight-night-tickets-qr");
    expect(qrFileName("Café signup")).toBe("reavers-cafe-signup-qr");
    expect(qrFileName("!!!")).toBe("reavers-link-qr");
  });
});

describe("shortLink", () => {
  it("drops the scheme and trailing slash", () => {
    expect(shortLink("https://reddeerreavers.com/")).toBe("reddeerreavers.com");
  });
});

describe("qrSvg", () => {
  const svg = qrSvg("https://reddeerreavers.com/", { logo: "data:image/png;base64,AAAA" });
  it("has a fixed size and a square viewBox, so editors resize it evenly", () => {
    expect(svg).toMatch(/^<svg [^>]*width="720" height="720" viewBox="0 0 (\d+) \1"/);
  });
  it("draws modules as filled shapes, not strokes", () => {
    expect(svg).toContain('fill="#000000"');
    expect(svg).not.toContain("stroke");
  });
  it("adds the crest in a white badge", () => {
    expect(svg).toContain('href="data:image/png;base64,AAAA"');
    expect(svg.match(/<rect /g)).toHaveLength(2);
  });
});

describe("makeTransparent", () => {
  it("removes the white background and badge, keeping the code and the crest", () => {
    const out = makeTransparent(qrSvg("hi", { logo: "logo" }));
    expect(out).not.toContain('fill="#ffffff"');
    expect(out).toContain('fill="#000000"');
    expect(out).toContain('href="logo"');
  });
});

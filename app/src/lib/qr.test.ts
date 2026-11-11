import { describe, expect, it } from "vitest";
import { addLogo, cleanLink, makeTransparent, qrFileName, shortLink } from "./qr";

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

describe("addLogo", () => {
  it("adds a centred badge and the logo before the end of the SVG", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37"><path d="M0 0h1"/></svg>\n';
    const out = addLogo(svg, "data:image/png;base64,AAAA");
    expect(out).toContain('<rect x="14.06" y="14.06" width="8.88" height="8.88"');
    expect(out).toContain('href="data:image/png;base64,AAAA"');
    expect(out.trim().endsWith("</svg>")).toBe(true);
  });
  it("leaves an SVG without a viewBox alone", () => {
    expect(addLogo("<svg></svg>", "x")).toBe("<svg></svg>");
  });
});

describe("makeTransparent", () => {
  it("removes the white background and the crest badge, keeping the code and the crest", () => {
    const svg = addLogo('<svg viewBox="0 0 25 25"><path fill="#ffffff" d="M0 0h25v25H0z"/><path stroke="#000000" d="M2 2.5h7"/></svg>', "logo");
    const out = makeTransparent(svg);
    expect(out).not.toContain('fill="#ffffff"');
    expect(out).toContain('<path stroke="#000000" d="M2 2.5h7"/>');
    expect(out).toContain('href="logo"');
  });
});

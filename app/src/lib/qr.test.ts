import { describe, expect, it } from "vitest";
import { cleanLink, qrFileName, shortLink } from "./qr";

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

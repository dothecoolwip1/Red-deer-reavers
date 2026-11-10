/** Money is kept as integer cents everywhere; these are the only two places that turn text into cents and back. */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  let text = input.trim();
  if (!text) return null;
  let negative = false;
  if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }
  text = text.replace(/[\s$,]|CAD/gi, "");
  if (text.startsWith("-")) { negative = !negative; text = text.slice(1); }
  if (text.startsWith("+")) text = text.slice(1);
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const cents = Math.round(Number(text) * 100);
  return negative ? -cents : cents;
}

const formatter = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol" });

export function formatMoney(cents: number): string {
  const text = formatter.format(Math.abs(cents) / 100);
  return cents < 0 ? `-${text}` : text;
}

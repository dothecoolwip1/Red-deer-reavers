import { parseMoney } from "./money";

export type ImportedTransaction = { date: string; description: string; amount_cents: number };
export type ColumnMapping = { date: number; description: number; amount?: number; debit?: number; credit?: number };

/** RFC 4180-style CSV: quoted fields, doubled quotes, commas and newlines inside quotes. Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(cell => cell.trim() !== "")) rows.push(row);
  return rows;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Dates as Canadian bank exports write them. Slashed dates are read month first (RBC, TD, ATB exports). */
export function parseDate(input: string): string | null {
  const text = input.trim();
  let m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return iso(+m[3], +m[1], +m[2]);
  m = text.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[1].toLowerCase()) + 1;
    return month ? iso(+m[3], month, +m[2]) : null;
  }
  m = text.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    return month ? iso(+m[3], month, +m[1]) : null;
  }
  return null;
}

/** Guess which columns hold the date, description and amount (or debit and credit) from the header row. */
export function guessMapping(headers: string[]): ColumnMapping {
  const h = headers.map(x => x.toLowerCase().trim());
  const find = (re: RegExp, skip: number[] = []) => h.findIndex((x, i) => re.test(x) && !skip.includes(i));
  const date = Math.max(0, find(/date/));
  const description = (() => {
    const i = find(/desc|detail|memo|payee|narrative|transaction|name/, [date]);
    return i >= 0 ? i : date === 0 ? 1 : 0;
  })();
  const debit = find(/debit|withdraw|paid out|money out/);
  const credit = find(/credit|deposit|paid in|money in/);
  if (debit >= 0 && credit >= 0) return { date, description, debit, credit };
  const amount = find(/amount|cad|\$|value/, [date, description]);
  return { date, description, amount: amount >= 0 ? amount : Math.min(2, headers.length - 1) };
}

export function rowsToTransactions(rows: string[][], map: ColumnMapping): { transactions: ImportedTransaction[]; errors: string[] } {
  const transactions: ImportedTransaction[] = [];
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const label = `Row ${index + 1}`;
    const rawDate = row[map.date] ?? "";
    const date = parseDate(rawDate);
    if (!date) { errors.push(`${label}: could not read the date "${rawDate}"`); return; }
    let amount: number | null;
    if (map.amount !== undefined) amount = parseMoney(row[map.amount]);
    else {
      const debit = parseMoney(row[map.debit ?? -1] ?? "") ?? 0;
      const credit = parseMoney(row[map.credit ?? -1] ?? "") ?? 0;
      amount = !debit && !credit ? null : credit - Math.abs(debit);
    }
    if (amount === null) { errors.push(`${label}: no amount`); return; }
    transactions.push({ date, description: (row[map.description] ?? "").trim(), amount_cents: amount });
  });
  return { transactions, errors };
}

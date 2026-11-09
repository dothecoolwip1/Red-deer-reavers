import { describe, expect, it } from "vitest";
import { guessMapping, parseCsv, parseDate, rowsToTransactions } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, commas in quotes, CRLF and blank lines", () => {
    const rows = parseCsv('Date,Description,Amount\r\n2026-11-01,"Gym rent, Nov",-400.00\r\n\r\n2026-11-02,"He said ""hi""",25\n');
    expect(rows).toEqual([
      ["Date", "Description", "Amount"],
      ["2026-11-01", "Gym rent, Nov", "-400.00"],
      ["2026-11-02", 'He said "hi"', "25"]
    ]);
  });
});

describe("parseDate", () => {
  it("reads ISO, slashed North American and month-name dates", () => {
    expect(parseDate("2026-11-09")).toBe("2026-11-09");
    expect(parseDate("2026/11/09")).toBe("2026-11-09");
    expect(parseDate("11/09/2026")).toBe("2026-11-09");
    expect(parseDate("Nov 9, 2026")).toBe("2026-11-09");
    expect(parseDate("nonsense")).toBeNull();
  });
});

describe("guessMapping", () => {
  it("finds a single amount column", () => {
    expect(guessMapping(["Transaction Date", "Description 1", "CAD$"])).toEqual({ date: 0, description: 1, amount: 2 });
  });
  it("finds separate debit and credit columns", () => {
    expect(guessMapping(["Date", "Details", "Withdrawals", "Deposits", "Balance"])).toEqual({
      date: 0, description: 1, debit: 2, credit: 3
    });
  });
});

describe("rowsToTransactions", () => {
  it("turns debit/credit rows into signed cents and reports bad rows", () => {
    const { transactions, errors } = rowsToTransactions(
      [["11/01/2026", "Rent", "400.00", ""], ["11/03/2026", "e-Transfer Dues", "", "60.00"], ["bad", "x", "1", ""]],
      { date: 0, description: 1, debit: 2, credit: 3 }
    );
    expect(transactions).toEqual([
      { date: "2026-11-01", description: "Rent", amount_cents: -40000 },
      { date: "2026-11-03", description: "e-Transfer Dues", amount_cents: 6000 }
    ]);
    expect(errors).toEqual(["Row 3: could not read the date \"bad\""]);
  });
});

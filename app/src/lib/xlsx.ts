// A small Excel (.xlsx) writer with no dependencies: styled sheets, money and date formats, formulas, frozen headers,
// filters, merged titles and print setup. The file is a plain ZIP (stored, not compressed) of the Office Open XML parts.

/** The look of a cell. Each name is one entry in styles.xml (see XF below, same order). */
export const STYLES = [
  "default", "title", "subtitle", "head", "headNum", "text", "wrap", "int", "money", "date", "label",
  "totalLabel", "totalInt", "totalMoney", "section", "good", "bad", "free", "kpiLabel", "kpiMoney", "kpiInt",
  "moneyGood", "moneyBad", "muted", "kpiMoneyGood", "kpiMoneyBad", "about", "kpiNote", "headCenter", "textRight"
] as const;
export type Style = (typeof STYLES)[number];

/** A cell: plain text or number, or an object with a style, a formula (with its cached value) or an ISO date. */
export type XCell = string | number | null | undefined | { v?: string | number | null; s?: Style; f?: string; date?: string | null };
export type Sheet = {
  name: string;
  rows: XCell[][];
  /** Column widths in characters; missing ones are sized from the content. */
  cols?: number[];
  /** Rows to keep on screen while scrolling (title and header). */
  freeze?: number;
  /** Filter buttons on a table: header row (1-based) and the number of columns. */
  filter?: { row: number; cols: number; last: number };
  merges?: string[];
  /** Taller rows, by 1-based row number. */
  heights?: Record<number, number>;
  tab?: string;
  landscape?: boolean;
  /** Ranges that get a light band on every other row (status pills are left out so they keep their colour). */
  stripes?: string[];
};

export const colName = (i: number) => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
export const ref = (col: number, row: number) => `${colName(col)}${row}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  // characters XML 1.0 can't carry
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/** Days since 1899-12-30, which is how Excel stores dates. */
export function excelDate(iso: string): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000;
}

// ------------------------------------------------------------------ styles

// The app's colours: iron (near black), gilt, royal purple, bone.
const IRON = "FF16121C", GILT = "FFD6A84C", GILT_HI = "FFF3CF7A", ROYAL = "FF4F2382", BONE = "FFF7F1E3", BONE_DIM = "FFC9BDA6", INK = "FF1F1A27", LINE = "FFE4DEEA", WHITE = "FFFFFFFF";
const font = (sz: number, rgb: string, opts = "") => `<font>${opts}<sz val="${sz}"/><color rgb="${rgb}"/><name val="Calibri"/><family val="2"/></font>`;
const FONTS = [
  font(11, INK), // 0 body
  font(20, GILT_HI, "<b/>"), // 1 banner title
  font(10, "FF6E6578", "<i/>"), // 2 note
  font(11, WHITE, "<b/>"), // 3 header / pill
  font(11, INK, "<b/>"), // 4 bold
  font(14, ROYAL, "<b/>"), // 5 section
  font(11, "FF1E7A46", "<b/>"), // 6 green
  font(11, "FFB3261E", "<b/>"), // 7 red
  font(10, "FF6E6578", "<b/>"), // 8 KPI label
  font(20, INK, "<b/>"), // 9 KPI value
  font(10, BONE_DIM), // 10 banner line
  font(20, "FF1E7A46", "<b/>"), // 11 KPI green
  font(20, "FFB3261E", "<b/>"), // 12 KPI red
  font(9, "FF6E6578", "<i/>"), // 13 KPI note
  font(10, "FF6E6578", "<i/>") // 14 muted note in tables
];
const solid = (rgb: string) => `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
// 0 none, 1 gray125 (required), 2 royal, 3 bone, 4 green pill, 5 red pill, 6 grey pill, 7 iron, 8 totals
const FILLS = [`<fill><patternFill patternType="none"/></fill>`, `<fill><patternFill patternType="gray125"/></fill>`,
  solid(ROYAL), solid(BONE), solid("FF2E8B57"), solid("FFC8463D"), solid("FF9A93A3"), solid(IRON), solid("FFEFE3C8")];
const side = (name: string, s?: [string, string]) => (s ? `<${name} style="${s[0]}"><color rgb="${s[1]}"/></${name}>` : `<${name}/>`);
const border = (b: { l?: [string, string]; r?: [string, string]; t?: [string, string]; btm?: [string, string] } = {}) =>
  `<border>${side("left", b.l)}${side("right", b.r)}${side("top", b.t)}${side("bottom", b.btm)}${side("diagonal")}</border>`;
const GAP: [string, string] = ["thick", WHITE];
const BORDERS = [
  border(), // 0
  border({ btm: ["thin", LINE] }), // 1 body row
  border({ t: ["medium", GILT], btm: ["medium", GILT] }), // 2 totals
  border({ btm: ["medium", GILT] }), // 3 section
  border({ l: GAP, r: GAP, t: ["thick", GILT] }), // 4 KPI card top
  border({ l: GAP, r: GAP }), // 5 KPI card middle
  border({ l: ["thin", WHITE], r: ["thin", WHITE], btm: ["thin", LINE] }), // 6 pill
  border({ btm: ["medium", GILT] }) // 7 header
];
const MONEY = 164, DATE = 165, INT = 3;
const NUMFMTS = `<numFmts count="2"><numFmt numFmtId="${MONEY}" formatCode="&quot;$&quot;#,##0.00;[Red]\\-&quot;$&quot;#,##0.00"/><numFmt numFmtId="${DATE}" formatCode="ddd\\ mmm\\ d,\\ yyyy"/></numFmts>`;

/** [font, fill, border, numFmt, horizontal, wrap] for each style, in STYLES order. */
const XF: Record<Style, [number, number, number, number, string?, boolean?]> = {
  default: [0, 0, 0, 0],
  title: [1, 7, 0, 0, "left"],
  about: [10, 7, 0, 0, "left"],
  subtitle: [2, 0, 0, 0],
  head: [3, 2, 7, 0, "left", true],
  headNum: [3, 2, 7, 0, "right", true],
  headCenter: [3, 2, 7, 0, "center", true],
  text: [0, 0, 1, 0],
  wrap: [0, 0, 1, 0, "left", true],
  int: [0, 0, 1, INT],
  money: [0, 0, 1, MONEY],
  date: [0, 0, 1, DATE, "left"],
  label: [4, 0, 1, 0],
  totalLabel: [4, 8, 2, 0],
  totalInt: [4, 8, 2, INT],
  totalMoney: [4, 8, 2, MONEY],
  section: [5, 0, 3, 0],
  good: [3, 4, 6, 0, "center"],
  bad: [3, 5, 6, 0, "center"],
  free: [3, 6, 6, 0, "center"],
  kpiLabel: [8, 3, 4, 0],
  kpiMoney: [9, 3, 5, MONEY, "left"],
  kpiInt: [9, 3, 5, INT, "left"],
  kpiMoneyGood: [11, 3, 5, MONEY, "left"],
  kpiMoneyBad: [12, 3, 5, MONEY, "left"],
  kpiNote: [13, 3, 5, 0, "left"],
  moneyGood: [6, 0, 1, MONEY],
  moneyBad: [7, 0, 1, MONEY],
  muted: [14, 0, 1, 0, "left", true],
  textRight: [0, 0, 1, 0, "right"]
};

function stylesXml() {
  const xfs = STYLES.map(s => {
    const [font, fill, bd, fmt, h, wrap] = XF[s];
    // A one-character inset keeps a right-aligned amount from running into the text in the next column.
    const plain = s === "default" || s === "subtitle" || s === "section";
    const horizontal = h ?? (plain ? undefined : fmt ? "right" : "left");
    const indent = horizontal === "left" || horizontal === "right" ? ` indent="1"` : "";
    const align = `<alignment vertical="center"${horizontal ? ` horizontal="${horizontal}"` : ""}${indent}${wrap ? ` wrapText="1"` : ""}/>`;
    return `<xf numFmtId="${fmt}" fontId="${font}" fillId="${fill}" borderId="${bd}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${align}</xf>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${NUMFMTS}<fonts count="${FONTS.length}">${FONTS.join("")}</fonts><fills count="${FILLS.length}">${FILLS.join("")}</fills><borders count="${BORDERS.length}">${BORDERS.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="1"><dxf><fill><patternFill patternType="solid"><bgColor rgb="FFF6F3F9"/></patternFill></fill></dxf></dxfs></styleSheet>`;
}

// ------------------------------------------------------------------ sheets

const MONEYISH = new Set<Style>(["money", "totalMoney", "kpiMoney", "moneyGood", "moneyBad", "kpiMoneyGood", "kpiMoneyBad"]);

function cellXml(c: XCell, r: string): string {
  if (c === null || c === undefined) return "";
  const o = typeof c === "object" ? c : { v: c };
  const s = o.s ?? (typeof o.v === "number" ? "int" : o.date !== undefined ? "date" : "text");
  const si = STYLES.indexOf(s);
  if (o.f) {
    const cached = typeof o.v === "number" ? `<v>${o.v}</v>` : "";
    return `<c r="${r}" s="${si}"><f>${esc(o.f)}</f>${cached}</c>`;
  }
  if (o.date !== undefined) {
    const n = o.date ? excelDate(o.date) : null;
    return n === null ? `<c r="${r}" s="${si}"/>` : `<c r="${r}" s="${si}"><v>${n}</v></c>`;
  }
  if (typeof o.v === "number") return `<c r="${r}" s="${si}"><v>${Number.isFinite(o.v) ? o.v : 0}</v></c>`;
  if (o.v === null || o.v === undefined || o.v === "") return `<c r="${r}" s="${si}"/>`;
  return `<c r="${r}" s="${si}" t="inlineStr"><is><t xml:space="preserve">${esc(String(o.v))}</t></is></c>`;
}

/** Width in characters a cell needs, roughly. Titles and sections are left out (they run across columns). */
function cellWidth(c: XCell): number {
  if (c === null || c === undefined) return 0;
  const o = typeof c === "object" ? c : { v: c };
  if (o.s === "title" || o.s === "about" || o.s === "subtitle" || o.s === "section" || o.s === "muted" || o.s === "kpiNote") return 0;
  if (o.date !== undefined) return 13;
  if (typeof o.v === "number") return MONEYISH.has(o.s ?? "int") ? Math.max(10, Math.abs(o.v).toFixed(2).length + 5) : String(o.v).length + 2;
  const longest = String(o.v ?? "").split("\n").reduce((m, l) => Math.max(m, l.length), 0);
  return o.s === "head" || o.s === "headNum" ? Math.min(longest + 3, 18) : longest + 2;
}

function sheetXml(sh: Sheet): string {
  const ncols = Math.max(1, ...sh.rows.map(r => r.length));
  const widths = Array.from({ length: ncols }, (_, i) => sh.cols?.[i] ?? Math.min(48, Math.max(9, ...sh.rows.map(r => cellWidth(r[i])))));
  const cols = `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join("")}</cols>`;
  const rows = sh.rows.map((r, ri) => {
    const n = ri + 1;
    const ht = sh.heights?.[n];
    const cells = r.map((c, ci) => cellXml(c, ref(ci, n))).join("");
    return `<row r="${n}"${ht ? ` ht="${ht}" customHeight="1"` : ""}>${cells}</row>`;
  }).join("");
  const pane = sh.freeze ? `<pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${sh.freeze + 1}" sqref="A${sh.freeze + 1}"/>` : "";
  const filter = sh.filter ? `<autoFilter ref="${ref(0, sh.filter.row)}:${ref(sh.filter.cols - 1, Math.max(sh.filter.row, sh.filter.last))}"/>` : "";
  const stripes = sh.stripes?.length ? `<conditionalFormatting sqref="${sh.stripes.join(" ")}"><cfRule type="expression" dxfId="0" priority="1"><formula>MOD(ROW(),2)=0</formula></cfRule></conditionalFormatting>` : "";
  const merges = sh.merges?.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr>${sh.tab ? `<tabColor rgb="${sh.tab}"/>` : ""}<pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${ref(ncols - 1, Math.max(1, sh.rows.length))}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="20" customHeight="1"/>${cols}<sheetData>${rows}</sheetData>${filter}${merges}${stripes}<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="${sh.landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L&amp;8${esc(sh.name)}&amp;R&amp;8Page &amp;P of &amp;N</oddFooter></headerFooter></worksheet>`;
}

/** Excel's rules for sheet names: 31 characters, none of \ / ? * [ ] :, and unique. */
export function sheetNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map(n => {
    const base = (n.replace(/[\\/?*[\]:]/g, "-").trim() || "Sheet").slice(0, 31);
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
    used.add(name.toLowerCase());
    return name;
  });
}

export function workbookFiles(sheets: Sheet[], title = ""): Record<string, string> {
  const names = sheetNames(sheets.map(s => s.name));
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>Red Deer Reavers app</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
    "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Red Deer Reavers app</Application></Properties>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>${definedNames(sheets, names)}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    "xl/styles.xml": stylesXml()
  };
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s); });
  return files;
}

function definedNames(sheets: Sheet[], names: string[]) {
  const list = sheets.flatMap((s, i) => {
    const q = `'${names[i].replace(/'/g, "''")}'`;
    const out: string[] = [];
    if (s.filter) out.push(`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${esc(`${q}!$A$${s.filter.row}:$${colName(s.filter.cols - 1)}$${Math.max(s.filter.row, s.filter.last)}`)}</definedName>`);
    if (s.freeze) out.push(`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${esc(`${q}!$1:$${s.freeze}`)}</definedName>`);
    return out;
  });
  return list.length ? `<definedNames>${list.join("")}</definedNames>` : "";
}

// ------------------------------------------------------------------ zip

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(data: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < data.length; i++) c = CRC[(c ^ data[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** A ZIP archive with every file stored as is (Excel reads uncompressed parts fine). */
export function zip(files: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const locals: Uint8Array[] = [], centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [path, text] of Object.entries(files)) {
    const name = enc.encode(path), data = enc.encode(text), crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, time, true); lv.setUint16(12, date, true); lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    local.set(name, 30); local.set(data, 30 + name.length);
    const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true); cv.setUint16(14, date, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); central.set(name, 46);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const cdSize = centrals.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, centrals.length, true); ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + cdSize + 22);
  let p = 0;
  for (const part of [...locals, ...centrals, end]) { out.set(part, p); p += part.length; }
  return out;
}

export const workbook = (sheets: Sheet[], title = "") => zip(workbookFiles(sheets, title));

export function downloadXlsx(filename: string, sheets: Sheet[], title = "") {
  const blob = new Blob([workbook(sheets, title)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

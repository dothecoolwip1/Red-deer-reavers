import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "_site");
const htmlFiles = (await fs.readdir(out)).filter(file => file.endsWith(".html"));
let failures = 0;

for (const file of htmlFiles) {
  const html = await fs.readFile(path.join(out, file), "utf8");
  const checks = [
    ["doctype", /<!doctype html>/i.test(html)],
    ["single body", (html.match(/<body\b/gi) || []).length === 1 && (html.match(/<\/body>/gi) || []).length === 1],
    ["single main", file === "404.html" || ((html.match(/<main\b/gi) || []).length === 1 && (html.match(/<\/main>/gi) || []).length === 1)],
    ["html close", /<\/html>/i.test(html)]
  ];
  for (const [label, ok] of checks) {
    if (!ok) {
      failures++;
      console.error(`${file}: failed ${label}`);
    }
  }

  const refs = [...html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:)/i.test(ref)) continue;
    const clean = decodeURIComponent(ref);
    const target = clean === "/" || clean === "./" ? path.join(out, "index.html") : path.join(out, clean);
    try { await fs.access(target); }
    catch {
      failures++;
      console.error(`${file}: missing local reference ${ref}`);
    }
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(out, "assets/generated/gallery/manifest.json"), "utf8"));
if (!Array.isArray(manifest) || manifest.length < 1) {
  failures++;
  console.error("Gallery manifest was not generated.");
}

if (failures) process.exit(1);
console.log(`Static checks passed for ${htmlFiles.length} HTML files and ${manifest.length} optimized gallery images.`);

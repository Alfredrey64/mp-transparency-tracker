// Reads every page's own section headings so the site search can find what is INSIDE a page, not just the page's name.
//
// It opens each page in a headless browser (the built site, served by `npx vite preview --port 4178 --strictPort`), takes the h2 headings the page shows
// (the same ones "On this page" lists, so a result can jump straight to one) and writes them to src/data/pageHeadings.json.
//
//   node scripts/build-heading-index.mjs [baseUrl]      (ONLY=a,b refreshes just those pages and keeps the rest)
//
// Headings that come from live data (a list of bills, a named MP) are left out: they change daily and would go stale. A heading is kept only when it
// reads the same on every visit, which is checked by loading the page twice. Run it again after adding a page or changing a page's headings; a unit
// test fails when a page is missing from the file.

import fs from "node:fs";
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "../e2e/pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const OUT = new URL("../src/data/pageHeadings.json", import.meta.url);
const SKIP = ".page-hero, .sn, [role='dialog'], .site-footer, .t-root, .tm-sheet, .jc-card, .dp-stop";
const PAGES = PAGE_NAMES.filter((p) => !ONLY || ONLY.includes(p));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

async function read(name) {
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  try {
    await page.goto(`${base}/${name}`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("h1", { timeout: 20000 });
    await page.waitForTimeout(2500);
    return await page.evaluate((skip) => {
      const main = document.getElementById("main-content");
      const heads = [...(main?.querySelectorAll("h2") ?? [])]
        .filter((h) => !h.closest(skip) && h.offsetParent !== null)
        .map((h) => h.textContent.replace(/\s+/g, " ").trim())
        .filter((t) => t.length >= 3 && t.length <= 80);
      return { title: main?.querySelector("h1")?.textContent.replace(/\s+/g, " ").trim() ?? "", heads };
    }, SKIP);
  } finally { await page.close(); }
}

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const out = ONLY ? { ...old } : {};
let next = 0;
async function worker() {
  while (next < PAGES.length) {
    const name = PAGES[next++];
    try {
      const a = await read(name);
      const b = await read(name);
      const again = new Set(b.heads);
      // Only headings that appeared both times, in the order of the first visit.
      const stable = [...new Set(a.heads)].filter((h) => again.has(h));
      out[name] = { title: a.title, heads: stable };
      process.stdout.write(`${name}: ${stable.length}\n`);
    } catch (e) { console.error(`${name}: ${e.message.split("\n")[0]}`); if (old[name]) out[name] = old[name]; }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
await browser.close();

const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
fs.writeFileSync(OUT, `${JSON.stringify(sorted, null, 1)}\n`);
console.log(`Wrote ${Object.keys(sorted).length} pages to src/data/pageHeadings.json`);

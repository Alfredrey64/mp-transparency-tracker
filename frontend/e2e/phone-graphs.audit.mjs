// Opens every page at phone widths in mobile WebKit and checks each graph: not wider than the screen, not clipped by its box, labels big enough to read and
// not cut off. Prints what it finds. Usage: node e2e/phone-graphs.audit.mjs [width] [baseUrl]
import { webkit } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";
import fs from "node:fs";

const width = Number(process.argv[2] ?? 360);
const base = process.argv[3] ?? "http://localhost:4178";
const specText = fs.readFileSync(new URL("./phone-layout.spec.js", import.meta.url), "utf8");
const TABS = JSON.parse(specText.match(/const TABS = (\[.*?\]);/s)[1]);
const ONLY = process.env.ONLY?.split(",");
const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));
const MIN_FONT = 8.5;

function audit({ minFont }) {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const tag = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label").slice(0, 40)}]` : ""}${typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : ""}`;
  for (const svg of document.querySelectorAll("main svg, #main-content svg")) {
    const r = svg.getBoundingClientRect();
    if (svg.closest(".tm-preview")) continue; // a thumbnail of a lesson slide, not meant to be read
    if (r.width < 40 || r.height < 20 || getComputedStyle(svg).display === "none" || svg.closest("[aria-hidden='true']") && r.width < 120) continue;
    const name = tag(svg);
    // A picture inside a box that scrolls sideways is meant to be wider than the screen.
    let scrolls = false;
    for (let p = svg.parentElement; p && p !== document.body; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth + 2) { scrolls = true; break; }
    if (!scrolls && r.right > vw + 1 || r.left < -1) out.push(`${name}: sticks out of the screen (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw})`);
    // Clipped by an ancestor that hides overflow.
    for (let p = svg.parentElement; !scrolls && p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|clip)/.test(cs.overflowX)) { const pr = p.getBoundingClientRect(); if (r.right > pr.right + 2 || r.left < pr.left - 2) out.push(`${name}: clipped by ${tag(p)}`); break; }
    }
    const texts = [...svg.querySelectorAll("text")].filter((t) => t.textContent.trim() && getComputedStyle(t).display !== "none");
    let tiny = 0, cut = 0, worst = 99;
    for (const t of texts) {
      const m = t.getScreenCTM(); const fs = parseFloat(getComputedStyle(t).fontSize) || 10; const eff = m ? fs * Math.sqrt(m.a * m.a + m.b * m.b) : fs;
      if (eff < minFont) { tiny += 1; worst = Math.min(worst, eff); }
      const tr = t.getBoundingClientRect();
      if (tr.width > 0 && (tr.left < r.left - 1 || tr.right > r.right + 1 || tr.top < r.top - 1 || tr.bottom > r.bottom + 1)) cut += 1;
    }
    if (tiny) out.push(`${name}: ${tiny} of ${texts.length} labels smaller than ${minFont}px (smallest ${worst.toFixed(1)}px)`);
    if (cut) out.push(`${name}: ${cut} labels run past the edge of the picture`);
  }
  for (const el of document.querySelectorAll("main canvas")) { const r = el.getBoundingClientRect(); if (r.width > 40 && r.right > vw + 1) out.push(`${tag(el)}: canvas sticks out of the screen`); }
  // Boxes that hide overflow while their content is wider than they are, where the content is a chart or table.
  for (const el of document.querySelectorAll("main *")) {
    const cs = getComputedStyle(el);
    if (/(hidden|clip)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 3 && el.clientWidth > 40 && el.querySelector("svg, table, canvas")) out.push(`${tag(el)}: hides ${el.scrollWidth - el.clientWidth}px of its chart or table`);
  }
  for (const t of document.querySelectorAll("main table")) { const r = t.getBoundingClientRect(); if (r.right > vw + 1 && !t.closest("[style*='overflow'], .table-scroll")) out.push(`${tag(t)}: table wider than the screen with no scroll area`); }
  return [...new Set(out)];
}

const b = await webkit.launch();
const ctx = await b.newContext({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const results = [];
for (const view of [...PAGES, ...(ONLY ? TABS.filter((t) => ONLY.includes(t)) : TABS)]) {
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.route("**/api.postcodes.io/**", (r) => r.abort());
  try {
    await page.goto(`${base}/${view === "home" ? "" : view}`, { waitUntil: "load" });
    await page.waitForSelector("h1", { timeout: 15000 });
    await page.waitForTimeout(500);
    // Scroll through so charts that draw on arrival are drawn and measured.
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(900);
    const found = await page.evaluate(audit, { minFont: MIN_FONT });
    if (found.length) results.push([view, found]);
  } catch (e) { results.push([view, [`could not open: ${String(e.message).split("\n")[0]}`]]); }
  await page.close();
}
await b.close();
console.log(`Checked ${PAGES.length + (ONLY ? TABS.filter((t) => ONLY.includes(t)).length : TABS.length)} pages at ${width}px. ${results.length} with something to look at.`);
for (const [view, list] of results) { console.log(`\n${view}`); for (const l of list) console.log(`  - ${l}`); }

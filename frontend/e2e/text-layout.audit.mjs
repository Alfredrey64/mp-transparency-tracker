// Opens every page in mobile WebKit at a phone or iPad width and checks the text on it: nothing smaller than a person can read, no word or box cut off by the box around it,
// nothing sticking out past the edge of the screen, no heading squeezed into a sliver of a column. Prints what it finds, worst first. It cannot judge looks, so use
// `npm run shots` for pictures of the pages it names.
//
// Usage: node e2e/text-layout.audit.mjs [width] [height] [baseUrl]      (ONLY=page,page limits it; MIN_FONT=11 sets the smallest text size)
import { webkit } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";
import fs from "node:fs";

const width = Number(process.argv[2] ?? 390);
const height = Number(process.argv[3] ?? 844);
const base = process.argv[4] ?? "http://localhost:4178";
const specText = fs.readFileSync(new URL("./phone-layout.spec.js", import.meta.url), "utf8");
const TABS = JSON.parse(specText.match(/const TABS = (\[.*?\]);/s)[1]);
const ONLY = process.env.ONLY?.split(",");
const MIN_FONT = Number(process.env.MIN_FONT ?? 11);
const PAGES = ["home", "list", "partymatch", ...PAGE_NAMES, ...TABS].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));

// Runs in the page.
function audit({ minFont }) {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const tag = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  const words = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const hidden = (el) => { const s = getComputedStyle(el); return s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0; };
  const insideScroller = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; return false; };
  const direct = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  const sr = (el) => el.closest(".sr-only, .skip-link, [aria-hidden='true'], .tm-preview, svg, script, style, noscript");
  const seen = { tiny: new Map(), clipped: [], poke: [], sliver: [], tall: [] };

  for (const el of document.querySelectorAll("body *")) {
    if (hidden(el) || sr(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const s = getComputedStyle(el);
    // 1. Text too small to read.
    if (direct(el)) {
      const fs = parseFloat(s.fontSize);
      if (fs < minFont && !el.closest("sup, sub")) { const k = `${fs.toFixed(1)}px`; (seen.tiny.get(k) ?? seen.tiny.set(k, []).get(k)).push(`${tag(el)} "${words(el)}"`); }
    }
    // 2. Text cut off by the box that holds it.
    if (direct(el) && /(hidden|clip)/.test(s.overflowX + s.overflowY) && !(s.textOverflow === "ellipsis") && !/-webkit-box/.test(s.display)) {
      if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 3) seen.clipped.push(`${tag(el)} "${words(el)}" (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`);
    }
    // 3. Anything sticking out of the screen that is not inside a box meant to scroll.
    if ((r.right > vw + 2 || r.left < -2) && r.right > -1000 && s.position !== "fixed" && !insideScroller(el) && direct(el)) seen.poke.push(`${tag(el)} "${words(el)}" spans ${Math.round(r.left)} to ${Math.round(r.right)}`);
    // 4. A heading or label squeezed into a sliver of a column so that every word is on its own line.
    if (/^H[1-4]$/.test(el.tagName) && r.width < 120 && el.textContent.trim().split(/\s+/).length > 2) seen.sliver.push(`${tag(el)} "${words(el)}" is ${Math.round(r.width)}px wide`);
    // 5. A single word broken across lines in the middle (letter-by-letter wrapping in narrow columns): a very tall, very thin text box.
    if (direct(el) && r.width < 70 && r.height > 160 && el.textContent.trim().length > 12) seen.tall.push(`${tag(el)} "${words(el)}" is ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  if (document.documentElement.scrollWidth > vw + 1) out.push(`PAGE SCROLLS SIDEWAYS: ${document.documentElement.scrollWidth}px of ${vw}px`);
  for (const [k, v] of [...seen.tiny].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))) out.push(`TINY ${k}: ${v.length} (e.g. ${v.slice(0, 2).join("; ")})`);
  for (const k of ["clipped", "poke", "sliver", "tall"]) for (const v of seen[k].slice(0, 4)) out.push(`${k.toUpperCase()}: ${v}`);
  return out;
}

const b = await webkit.launch();
const ctx = await b.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const results = [];
for (const view of PAGES) {
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.route("**/api.postcodes.io/**", (r) => r.abort());
  try {
    await page.goto(`${base}/${view === "home" ? "" : view}`, { waitUntil: "load" });
    await page.waitForSelector("h1", { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.dispatchEvent(new Event("ons-show-all-cards")));
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(700);
    const found = await page.evaluate(audit, { minFont: MIN_FONT });
    if (found.length) results.push([view, found]);
  } catch (e) { results.push([view, [`COULD NOT OPEN: ${String(e.message).split("\n")[0]}`]]); }
  await page.close();
}
await b.close();
console.log(`Checked ${PAGES.length} pages at ${width}x${height}. ${results.length} with something to look at.`);
for (const [view, list] of results) { console.log(`\n${view}`); for (const l of list) console.log(`  - ${l}`); }

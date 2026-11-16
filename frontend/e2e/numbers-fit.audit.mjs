// Opens every page at several widths and fails on two things that make a number or a chart look wrong:
//   - text cut off: any visible text that runs past the edge of the box that holds it (an ancestor that clips its overflow), which is how "£1,394.8bn" lost its last letters in a
//     headline tile. Text that scrolls inside its own scroll area (a table, a strip of tabs) is not counted.
//   - a chart axis that repeats itself: two labels on one axis that read the same ("£25bn" twice), which makes the scale look wrong even when the gridlines are right.
// Usage: node e2e/numbers-fit.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; WIDTHS=390,1280 sets the widths; WORKERS=3; CHARTS=0 skips the axis check)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`.
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const WIDTHS = (process.env.WIDTHS ?? "320,390,768,1280").split(",").map(Number);
const WORKERS = Number(process.env.WORKERS ?? 3);
const CHARTS = process.env.CHARTS !== "0";
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));

const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    for (const width of WIDTHS) {
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 30000 });
        await page.waitForSelector("h1", { timeout: 20000 });
        await page.waitForTimeout(1200);
        // Scroll through so lazily drawn parts exist, then look.
        await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < Math.min(h, 14000); y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } window.scrollTo(0, 0); });
        const found = await page.evaluate(({ charts }) => {
          const clipped = []; const repeats = [];
          const shortText = (t) => t.replace(/\s+/g, " ").trim().slice(0, 40);
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const seen = new Set();
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const text = n.textContent.trim(); if (!text) continue;
            const el = n.parentElement; if (!el || el.closest("svg, script, style, noscript, [aria-hidden='true'], .sr-only, [hidden]")) continue;
            const range = document.createRange(); range.selectNodeContents(n);
            const r = range.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
            for (let a = el; a && a !== document.body; a = a.parentElement) {
              const cs = getComputedStyle(a);
              if (cs.display === "none") break;
              const clips = (cs.overflowX !== "visible") || (cs.overflowY !== "visible");
              if (!clips) continue;
              // A scroll area is meant to show part of its content.
              if (/auto|scroll/.test(cs.overflowX) && a.scrollWidth > a.clientWidth) break;
              const b = a.getBoundingClientRect();
              if (b.width < 3 || b.height < 3) break;
              if (r.right > b.right + 1.5 || r.left < b.left - 1.5) {
                const key = `${a.className}|${shortText(text)}`;
                if (!seen.has(key)) { seen.add(key); clipped.push(`"${shortText(text)}" in ${a.nodeName.toLowerCase()}.${String(a.className).trim().split(/\s+/)[0] ?? ""}[${(a.getAttribute("style") ?? "").slice(0, 90)}] inside ${a.parentElement?.nodeName.toLowerCase()}.${String(a.parentElement?.className).trim().split(/\s+/)[0]} (text ${Math.round(r.left)}-${Math.round(r.right)}, box ${Math.round(b.left)}-${Math.round(b.right)})`); }
                break;
              }
            }
          }
          if (charts) {
            for (const svg of document.querySelectorAll("svg")) {
              const texts = [...svg.querySelectorAll("text")].filter((t) => t.textContent.trim());
              const sameAxis = (sel) => { const by = new Map(); for (const t of texts.filter(sel)) { const k = Math.round(Number(t.getAttribute(sel.axis === "x" ? "y" : "x"))); (by.get(k) ?? by.set(k, []).get(k)).push(t.textContent.trim()); } return by; };
              const yAxis = Object.assign((t) => t.getAttribute("text-anchor") === "end", { axis: "y" });
              const xAxis = Object.assign((t) => t.getAttribute("text-anchor") !== "end", { axis: "x" });
              for (const [, labels] of sameAxis(yAxis)) { const d = labels.filter((l, i) => labels.indexOf(l) !== i); if (labels.length > 2 && d.length) repeats.push(`y axis repeats ${[...new Set(d)].join(", ")} (${labels.join(" | ")})`); }
              for (const [, labels] of sameAxis(xAxis)) { const d = labels.filter((l, i) => labels.indexOf(l) !== i); if (labels.length > 2 && d.length) repeats.push(`x axis repeats ${[...new Set(d)].join(", ")} (${labels.join(" | ")})`); }
            }
          }
          return { clipped: clipped.slice(0, 8), repeats: [...new Set(repeats)].slice(0, 5) };
        }, { charts: CHARTS && width >= 768 && pg !== "teacher" });
        results.push({ pg, width, ...found });
      } catch (e) { results.push({ pg, width, error: e.message.split("\n")[0] }); }
    }
    await page.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();

const bad = results.filter((r) => r.error || r.clipped?.length || r.repeats?.length).sort((a, b) => a.pg.localeCompare(b.pg) || a.width - b.width);
console.log(`Opened ${PAGES.length} pages at ${WIDTHS.join(", ")} px. ${bad.length} page and width combinations to look at.\n`);
for (const r of bad) {
  if (r.error) console.log(`${r.pg} @${r.width}: ${r.error}`);
  for (const c of r.clipped ?? []) console.log(`${r.pg} @${r.width}: cut off: ${c}`);
  for (const c of r.repeats ?? []) console.log(`${r.pg} @${r.width}: ${c}`);
}
if (process.env.GITHUB_ACTIONS) for (const r of bad) console.log(`::error title=Numbers and charts::${r.pg} @${r.width}: ${r.error ?? [...(r.clipped ?? []), ...(r.repeats ?? [])].join("; ")}`);
process.exit(bad.length ? 1 : 0);

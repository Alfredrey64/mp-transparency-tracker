// Checks that a picture that plays when it scrolls into view builds in a sensible order: its boxes arrive first, and only then do coins, letters or speech bubbles start to travel
// between them. For every picture with arriving boxes (.dmx-in, .ttm-card) it scrolls the picture to the middle of the screen, then looks every 100 ms for three seconds at
// (a) when the first moving part (a shape with an animateMotion inside it) can be seen and (b) when the last box finished arriving. A moving part that can be seen
// more than a fifth of a second before the boxes have all landed is reported, as is one that is already visible the moment the picture comes into view.
// Usage: node e2e/loadin.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; WIDTH=390 checks the phone layout; WORKERS=3)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`.
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const WORKERS = Number(process.env.WORKERS ?? 3);
const WIDTH = Number(process.env.WIDTH ?? 1280);
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));

const browser = await chromium.launch();
const bad = [];
let checked = 0;
let next = 0;
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 800 }, serviceWorkers: "block" });
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    try {
      await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForSelector("h1", { timeout: 20000 });
      await page.waitForTimeout(1200);
      const count = await page.evaluate(() => [...document.querySelectorAll("svg")].filter((s) => s.querySelector(".dmx-in, .ttm-card") && s.getBoundingClientRect().width > 0).length);
      for (let i = 0; i < count; i++) {
        const r = await page.evaluate(async (i) => {
          const svg = [...document.querySelectorAll("svg")].filter((s) => s.querySelector(".dmx-in, .ttm-card") && s.getBoundingClientRect().width > 0)[i];
          const box = svg.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + box.top + box.height / 2 - innerHeight / 2);
          const t0 = performance.now();
          let firstMove = null, lastLanded = 0;
          const name = svg.getAttribute("aria-label")?.slice(0, 50) || svg.closest("figure")?.id || svg.parentElement?.className?.toString().slice(0, 40) || "(unnamed)";
          while (performance.now() - t0 < 3600) {
            const t = performance.now() - t0;
            const boxes = [...svg.querySelectorAll(".dmx-in, .ttm-card")];
            const landed = boxes.every((b) => b.getAnimations().every((a) => a.playState === "finished" || a.effect.getComputedTiming().iterations === Infinity));
            if (!landed) lastLanded = t;
            if (firstMove === null) {
              const seen = [...svg.querySelectorAll("animateMotion")].some((m) => parseFloat(getComputedStyle(m.parentElement).opacity) > 0.08);
              if (seen) firstMove = t;
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          return { name, firstMove, lastLanded };
        }, i);
        checked++;
        if (r.firstMove !== null && r.firstMove < r.lastLanded - 200) bad.push(`${pg}: "${r.name}" first moving part at ${Math.round(r.firstMove)} ms, boxes landed at ${Math.round(r.lastLanded)} ms`);
      }
    } catch (e) {
      bad.push(`${pg}: ${String(e).split("\n")[0]}`);
    }
    await page.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
console.log(`Checked ${checked} pictures with arriving boxes. ${bad.length} to look at.`);
for (const b of bad) console.log(b);

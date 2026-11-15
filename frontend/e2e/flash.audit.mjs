// Scrolls every page from top to bottom and watches every frame of every running CSS animation for a flash: an element that was fully visible and then drops to nearly invisible, which
// is what a diagram looks like when it shows its finished state and then snaps back to its start to play. Prints the pages where it happened.
// Usage: node e2e/flash.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; WORKERS=3 sets how many run at once)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`.
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const WORKERS = Number(process.env.WORKERS ?? 3);
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));
const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    try {
      await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForSelector("h1", { timeout: 20000 });
      await page.waitForTimeout(1800);
      const flashes = await page.evaluate(async () => {
        const out = []; const seen = new WeakMap();
        const sample = () => {
          for (const a of document.getAnimations()) {
            const el = a.effect?.target; if (!(el instanceof Element)) continue;
            const o = Number(getComputedStyle(el).opacity);
            const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
            const s = seen.get(el) ?? { shown: false, flashed: false };
            if (o >= 0.95) s.shown = true; else if (o <= 0.3 && s.shown && !s.flashed) { s.flashed = true; out.push(`${el.nodeName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).slice(0, 30)}`); }
            seen.set(el, s);
          }
        };
        let stop = false; const loop = () => { sample(); if (!stop) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < Math.min(h, 12000); y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
        stop = true; return out;
      });
      results.push({ pg, flashes });
    } catch (e) { results.push({ pg, error: e.message.split("\n")[0] }); }
    await page.close();
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
const bad = results.filter((r) => r.error || r.flashes.length);
console.log(`Checked ${PAGES.length} pages. ${bad.length} with a flash or an error.\n`);
for (const r of bad) console.log(r.error ? `${r.pg}: ${r.error}` : `${r.pg}: ${r.flashes.length} flash${r.flashes.length === 1 ? "" : "es"} (${r.flashes.slice(0, 4).join(", ")})`);
if (process.env.GITHUB_ACTIONS) for (const r of bad) console.log(`::error title=Flash::${r.pg}: ${r.error ?? r.flashes.slice(0, 4).join(", ")}`);
process.exit(bad.length ? 1 : 0);

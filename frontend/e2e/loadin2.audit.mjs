// The wider check for the same fault as loadin.audit.mjs, for pictures built with CSS animation instead of SVG motion. Every [data-go] picture is scrolled into view and watched for
// four seconds. A "moving part" is something that never stops (an endless animation) or that travels along a line (offset-distance); an "arrival" is a one-off fade or pop-in. It
// reports a moving part that is visible while some other part of the same picture has still to arrive, which is how a picture looks when the coins are running and the boxes
// are not there yet. Pieces that sit inside the thing that is still arriving are ignored (they come with it).
// Usage: node e2e/loadin2.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; WIDTH=390 checks the phone layout; WORKERS=3)
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const WORKERS = Number(process.env.WORKERS ?? 3);
const WIDTH = Number(process.env.WIDTH ?? 1280);
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));

const browser = await chromium.launch();
const bad = [];
let checked = 0, next = 0;
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
      const count = await page.evaluate(() => [...document.querySelectorAll("[data-go]")].filter((e) => e.getBoundingClientRect().width > 40).length);
      for (let i = 0; i < count; i++) {
        const r = await page.evaluate(async (i) => {
          const root = [...document.querySelectorAll("[data-go]")].filter((e) => e.getBoundingClientRect().width > 40)[i];
          const box = root.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + box.top + Math.min(box.height, innerHeight * 0.6) / 2 - innerHeight / 2);
          const name = (e) => `${e.nodeName.toLowerCase()}${(e.getAttribute("class") || "").trim() ? "." + e.getAttribute("class").trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
          const visible = (e) => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { if (parseFloat(getComputedStyle(n).opacity) < 0.1) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight; };
          const hits = new Map();
          const t0 = performance.now();
          while (performance.now() - t0 < 4000) {
            const t = performance.now() - t0;
            const anims = root.getAnimations({ subtree: true }).filter((a) => a.effect?.target instanceof Element);
            const info = anims.map((a) => {
              const el = a.effect.target, tm = a.effect.getComputedTiming();
              const props = new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)));
              return { el, phase: tm.phase, endless: tm.iterations === Infinity, travels: props.has("offsetDistance") || props.has("offset-distance"), fade: props.has("opacity") || props.has("transform") || props.has("scale"), done: a.playState === "finished" };
            });
            const arrivals = info.filter((x) => !x.endless && !x.travels && x.fade && !x.done && (x.phase === "before" || x.phase === "active"));
            if (arrivals.length && t > 250) {
              for (const m of info) {
                if (!(m.endless || m.travels) || m.phase !== "active" || !visible(m.el)) continue;
                const late = arrivals.find((a) => !a.el.contains(m.el) && !m.el.contains(a.el) && a.phase === "before");
                if (late && !hits.has(name(m.el))) hits.set(name(m.el), `${name(m.el)} moving at ${Math.round(t)} ms while ${name(late.el)} had not yet arrived`);
              }
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          return { root: name(root), hits: [...hits.values()] };
        }, i);
        checked++;
        for (const h of r.hits) bad.push(`${pg} [${r.root}]: ${h}`);
      }
    } catch (e) {
      bad.push(`${pg}: ${String(e).split("\n")[0]}`);
    }
    await page.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
console.log(`Watched ${checked} pictures. ${bad.length} to look at.`);
for (const b of bad) console.log(b);

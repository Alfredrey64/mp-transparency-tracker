// Opens every page on an emulated phone (4x slower CPU), scrolls it from top to bottom and back, and reports the two things that make a page feel rough:
//   - layout shift: content that jumps while the visitor reads (the sum of the browser's layout-shift scores; under 0.1 is good, over 0.25 is poor),
//   - long tasks: stretches over 50 ms when the page cannot answer a touch (the longest, and the total over 50 ms).
// Prints pages over the limits. Usage: node e2e/smoothness.audit.mjs [baseUrl]      (ONLY=page,page limits it; WORKERS=4 sets how many run at once; SETTLE=1 scrolls only once the page height has stopped changing)
// Needs `npx vite preview --port 4178 --strictPort`.
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:4178";
const specText = fs.readFileSync(new URL("./phone-layout.spec.js", import.meta.url), "utf8");
const TABS = JSON.parse(specText.match(/const TABS = (\[.*?\]);/s)[1]);
const ONLY = process.env.ONLY?.split(",");
const WORKERS = Number(process.env.WORKERS ?? 4);
const PAGES = ["home", "list", "partymatch", ...PAGE_NAMES, ...TABS].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));
const CLS_LIMIT = Number(process.env.CLS ?? 0.1);
const TASK_LIMIT = Number(process.env.TASK ?? 250);

const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = []; window.__tasks = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(3), (e.sources?.[0]?.node?.className || e.sources?.[0]?.node?.nodeName || "").toString().slice(0, 40)]); } }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__tasks.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true });
    });
    try {
      await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 45000 });
      await page.waitForSelector("h1", { timeout: 25000 });
      await page.waitForTimeout(1500);
      // SETTLE=1 waits until the page has stopped changing height before scrolling. On a slow machine the data service's refusal (these runs abort it) can arrive after the scroll has
      // started, and a skeleton collapsing into an error note then moves the footer: a real effect, but one that depends on the machine, so CI settles first and local runs need not.
      if (process.env.SETTLE) {
        let last = -1; let still = 0;
        for (let i = 0; i < 40 && still < 4; i++) { const now = await page.evaluate(() => document.documentElement.scrollHeight); still = now === last ? still + 1 : 0; last = now; await page.waitForTimeout(400); }
      }
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < Math.min(h, 14000); y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts.slice(0, 4), tasks: window.__tasks }));
      results.push({ pg, cls: r.cls, shifts: r.shifts, longest: Math.max(0, ...r.tasks), blocked: r.tasks.reduce((s, t) => s + Math.max(0, t - 50), 0) });
    } catch (e) { results.push({ pg, error: e.message.split("\n")[0] }); }
    await ctx.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
const bad = results.filter((r) => r.error || r.cls > CLS_LIMIT || r.longest > TASK_LIMIT).sort((a, b) => (b.cls ?? 0) - (a.cls ?? 0));
console.log(`Checked ${PAGES.length} pages. ${bad.length} over the limits (layout shift > ${CLS_LIMIT}, or a task over ${TASK_LIMIT} ms).\n`);
for (const r of bad) console.log(r.error ? `${r.pg}: ${r.error}` : `${r.pg}: shift ${r.cls.toFixed(3)} longest task ${r.longest} ms, total over 50 ms ${r.blocked} ms${r.shifts.length ? `\n    first shifts (ms, score, element): ${r.shifts.map((s) => s.join(" ")).join(" | ")}` : ""}`);
const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`\nMedian shift ${med(results.filter((r) => !r.error).map((r) => r.cls)).toFixed(3)}, median longest task ${med(results.filter((r) => !r.error).map((r) => r.longest))} ms.`);
// On GitHub, each page over the limit becomes an annotation, so the reason is readable without opening the log.
if (process.env.GITHUB_ACTIONS) for (const r of bad) console.log(`::error title=Smoothness::${r.pg}: ${r.error ?? `shift ${r.cls.toFixed(3)}, longest task ${r.longest} ms${r.shifts.length ? `, first shifts ${r.shifts.map((x) => x.join(" ")).join(" | ")}` : ""}`}`);
process.exit(bad.length ? 1 : 0);

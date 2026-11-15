// Moves from page to page inside one session (the way a visitor clicks round the site, not a fresh load each time) and watches every frame of every move for the things that make it
// feel cut or jumpy:
//   - blank frames: frames where the page has lost its heading, so the visitor sees an empty screen between two pages,
//   - collapses: the page height dropping to under half and coming back (the footer or the content flashing up the screen),
//   - layout shift: the sum of the browser's layout-shift scores during the move,
//   - scroll jumps: the scroll position moving by itself after the new page has appeared.
// Prints the moves over the limits. Usage: node e2e/navigation.audit.mjs [baseUrl]   (ONLY=a,b limits the targets; STEP=5 takes every 5th page; PHONE=1 emulates a phone with a 4x slower CPU)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321` (the data service is refused, as in the other audits).
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const STEP = Number(process.env.STEP ?? 1);
const PHONE = Boolean(process.env.PHONE);
const CLS_LIMIT = Number(process.env.CLS ?? 0.1);
const BLANK_LIMIT = Number(process.env.BLANK ?? 3); // consecutive frames without a heading (about 50 ms)
const TARGETS = ["home", "list", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && p !== "home" && (!ONLY || ONLY.includes(p))).filter((_, i) => ONLY || i % STEP === 0);

const browser = await chromium.launch();
const ctx = await browser.newContext(PHONE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
if (PHONE) await (await ctx.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
await page.addInitScript(() => {
  window.__cls = 0; window.__shifts = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(3), (e.sources?.[0]?.node?.className || e.sources?.[0]?.node?.nodeName || "").toString().slice(0, 40)]); } }).observe({ type: "layout-shift", buffered: true });
  // Samples every frame for `ms`, then reports what it saw.
  window.__watch = (ms) => new Promise((done) => {
    // The old page stays on screen until the new one is ready, so everything is measured from the frame where the new page's container (a fresh <main>) appears.
    const t0 = performance.now(); const cls0 = window.__cls; const shifts0 = window.__shifts.length; const main0 = document.getElementById("main-content");
    let swapped = false; let swapFrame = -1; let blankRun = 0; let worstBlank = 0; let maxH = 0; let minAfterMax = Infinity; let lastY = window.scrollY; let jumps = 0; let frames = 0;
    const tick = () => {
      frames += 1;
      const main = document.getElementById("main-content");
      if (!swapped && main && main !== main0) { swapped = true; swapFrame = frames; lastY = window.scrollY; }
      if (swapped) {
        const hasHeading = Boolean(main?.querySelector("h1, h2"));
        if (hasHeading) blankRun = 0; else { blankRun += 1; worstBlank = Math.max(worstBlank, blankRun); }
        const h = document.documentElement.scrollHeight;
        if (h > maxH) { maxH = h; minAfterMax = h; } else minAfterMax = Math.min(minAfterMax, h);
        const y = window.scrollY; if (Math.abs(y - lastY) > 2) jumps += 1; lastY = y;
      }
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      else done({ frames, swapped, swapFrame, worstBlank, minH: minAfterMax === Infinity ? 0 : minAfterMax, maxH, jumps, cls: window.__cls - cls0, shifts: window.__shifts.slice(shifts0, shifts0 + 4) });
    };
    requestAnimationFrame(tick);
  });
});
await page.goto(`${base}/`, { waitUntil: "load" });
await page.waitForSelector("h1", { timeout: 25000 });
await page.waitForTimeout(1500);

const results = [];
for (const target of TARGETS) {
  try {
    const watch = page.evaluate(() => window.__watch(2800));
    await page.evaluate((t) => { window.location.hash = `#/${t}`; }, target);
    const r = await watch;
    results.push({ target, ...r, collapse: r.maxH > 0 && r.minH < r.maxH * 0.6, notSwapped: !r.swapped });
  } catch (e) { results.push({ target, error: e.message.split("\n")[0] }); }
}
await browser.close();

// A blank spell counts when the new page's container has been on screen for BLANK_LIMIT or more frames without a heading in it.
const bad = results.filter((r) => r.error || r.notSwapped || r.cls > CLS_LIMIT || r.worstBlank >= BLANK_LIMIT || r.collapse || r.jumps > 0);
console.log(`Moved to ${TARGETS.length} pages${PHONE ? " on a phone" : ""}. ${bad.length} over the limits (shift > ${CLS_LIMIT}, ${BLANK_LIMIT}+ blank frames on a new page, page height shrinking by 40%, scroll jumps).\n`);
for (const r of bad) console.log(r.error ? `${r.target}: ${r.error}` : r.notSwapped ? `${r.target}: the page never changed` : `${r.target}: shift ${r.cls.toFixed(3)}, blank frames ${r.worstBlank}, height ${r.minH}-${r.maxH}${r.collapse ? " (collapses)" : ""}, scroll jumps ${r.jumps}${r.shifts?.length ? `\n    shifts (ms, score, element): ${r.shifts.map((s) => s.join(" ")).join(" | ")}` : ""}`);
const worst = [...results].filter((r) => !r.error).sort((a, b) => b.worstBlank - a.worstBlank).slice(0, 3);
console.log(`\nSlowest to show a heading (frames): ${worst.map((r) => `${r.target} ${r.worstBlank}`).join(", ")}.`);
if (process.env.GITHUB_ACTIONS) for (const r of bad) console.log(`::error title=Navigation::${r.target}: ${r.error ?? `shift ${r.cls.toFixed(3)}, blank frames ${r.worstBlank}, height ${r.minH}-${r.maxH}, scroll jumps ${r.jumps}`}`);
process.exit(bad.length ? 1 : 0);

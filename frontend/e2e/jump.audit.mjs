// Finds the places where the screen moves by itself while someone is reading: scrolls each page in steps and, after each step, watches (every frame) where the content under the reader's eyes
// is drawn. Nothing should shift after the scroll has stopped; a shift of 16 px or more is reported with the element that was displaced and the amount.
// It runs in the engine that matters most for this: BROWSER=webkit is Safari's (which has no scroll anchoring of its own: lib/scrollAnchor.js supplies it), BROWSER=chromium the default.
// Usage: node e2e/jump.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; PHONE=1 emulates a phone; WORKERS=4 sets how many run at once; STEPS=8 how many stops down each page)
// Needs `npx vite preview --port 4178 --strictPort` (a build made with the test data address, as in the other audits).
import { chromium, webkit } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const PHONE = Boolean(process.env.PHONE);
const WORKERS = Number(process.env.WORKERS ?? 4);
const STEPS = Number(process.env.STEPS ?? 8);
const LIMIT = Number(process.env.JUMP ?? 16);
const type = process.env.BROWSER === "webkit" ? webkit : chromium;
const PAGES = ["home", "list", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));

const browser = await type.launch();
const found = [];
let next = 0;

async function worker() {
  while (next < PAGES.length) {
    const name = PAGES[next++];
    const ctx = await browser.newContext(PHONE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    try {
      await page.goto(`${base}/${name === "home" ? "" : name}`, { waitUntil: "load", timeout: 45000 });
      await page.waitForTimeout(2500);
      const worst = await page.evaluate(async (steps) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const frame = () => new Promise((r) => requestAnimationFrame(r));
        const label = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
        const block = (el) => { let a = el; while (a.parentElement && getComputedStyle(a).display.startsWith("inline")) a = a.parentElement; return a; };
        let worst = null;
        const total = document.documentElement.scrollHeight;
        const stops = Math.min(steps, Math.max(1, Math.floor(total / (innerHeight * 0.8))));
        for (let s = 1; s <= stops; s++) {
          window.scrollTo({ top: Math.round(s * innerHeight * 0.8), behavior: "instant" });
          await sleep(250);
          const at = document.elementsFromPoint(innerWidth / 2, Math.round(innerHeight * 0.35)).find((e) => e !== document.documentElement && e !== document.body && e.id !== "root");
          if (!at) continue;
          const el = block(at);
          const y0 = el.getBoundingClientRect().top;
          const t0 = performance.now();
          while (performance.now() - t0 < 600) {
            await frame();
            if (!el.isConnected) break;
            const d = el.getBoundingClientRect().top - y0;
            if (Math.abs(d) > Math.abs(worst?.by ?? 0)) worst = { by: Math.round(d), el: label(el), at: Math.round(scrollY) };
          }
        }
        return worst;
      }, STEPS);
      if (worst && Math.abs(worst.by) >= LIMIT) found.push({ page: name, ...worst });
    } catch (e) { found.push({ page: name, error: String(e.message ?? e).slice(0, 80) }); }
    await ctx.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
console.log(`${PAGES.length} pages in ${process.env.BROWSER === "webkit" ? "WebKit" : "Chromium"}${PHONE ? " (phone)" : ""}: ${found.length} with the screen moving by itself`);
for (const f of found.sort((a, b) => Math.abs(b.by ?? 0) - Math.abs(a.by ?? 0))) console.log(f.error ? `  ${f.page}: ${f.error}` : `  ${f.page}: ${f.by}px at scroll ${f.at} (${f.el})`);

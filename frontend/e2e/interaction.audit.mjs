// Presses the buttons on every page (tabs, range chips, filters, toggles, accordions) and watches every frame for the 0.7 s after each press, failing on what makes a press feel rough:
//   - a scroll jump: the page's scroll position changing by 40 px or more in a single frame (a smooth scroll moves a little each frame; a jump moves all at once),
//   - the control sliding away: the button that was pressed ending more than 80 px from where it was, so the finger is left on something that has moved,
//   - a blank: the page's heading disappearing for a frame, or the page height dropping to under half (the footer flashing up the screen).
// A press that goes to another page (the address changes) is left to navigation.audit.mjs, and the audit goes back to try the next control.
// Usage: node e2e/interaction.audit.mjs [baseUrl]   (BROWSER=webkit for Safari's engine; ONLY=a,b limits the pages; PHONE=1 emulates a phone; PER=10 presses per page; WORKERS=3; STEP=n takes every nth page)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`.
import { chromium, webkit } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const PHONE = process.env.PHONE === "1";
const PER = Number(process.env.PER ?? 10);
const WORKERS = Number(process.env.WORKERS ?? 3);
const STEP = Number(process.env.STEP ?? 1);
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p))).filter((_, i) => i % STEP === 0);

const TAG = () => {
  let i = 0;
  for (const el of document.querySelectorAll("main button, main [role='tab'], main [role='radio'], main summary, main [role='switch'], main input[type='checkbox'], main input[type='radio']")) {
    if (el.closest("nav, header, .skip-link, [aria-hidden='true'], dialog, [role='dialog']")) continue;
    const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue;
    if (el.disabled) continue;
    el.setAttribute("data-audit-press", String(i++));
  }
  return i;
};
async function fresh(page, url) {
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("h1", { timeout: 20000 });
  await page.waitForTimeout(1400);
  // Late-arriving data swaps a placeholder for the real thing a moment after the page shows. That is judged by navigation.audit.mjs; here it would be mistaken for the effect of a
  // press, so wait until the page height has held still for a second (or six seconds have passed) before choosing and pressing anything.
  await page.evaluate(() => new Promise((done) => {
    let last = document.documentElement.scrollHeight; let since = performance.now(); const t0 = since;
    const tick = () => {
      const h = document.documentElement.scrollHeight; const now = performance.now();
      if (h !== last) { last = h; since = now; }
      if (now - since > 1000 || now - t0 > 6000) done(); else setTimeout(tick, 100);
    };
    tick();
  }));
  return page.evaluate(TAG);
}

// BROWSER=webkit runs it in Safari's engine (which has no scroll anchoring of its own; lib/scrollAnchor.js supplies it).
const browser = await (process.env.BROWSER === "webkit" ? webkit : chromium).launch();
const results = [];
let pressed = 0;
let next = 0;

async function worker() {
  const ctx = await browser.newContext(PHONE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
  // NOANCHOR=1 makes the page think it is Chrome, so the Safari scroll-anchoring helper stays off (to see what it changes).
  if (process.env.NOANCHOR) await ctx.addInitScript(() => Object.defineProperty(navigator, "userAgent", { get: () => "Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0 Safari/537.36" }));
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const page = await ctx.newPage();
    try {
      const startUrl = `${base}/${pg === "home" ? "" : pg}`;
      const count = await fresh(page, startUrl);
      const picks = []; const stride = Math.max(1, Math.floor(count / PER)); for (let i = 0; i < count && picks.length < PER; i += stride) picks.push(i);
      let first = true;
      for (const idx of picks) {
        // A press that feels rough is tried a second time on a fresh load: the slower the machine, the more often something arrives late and moves the page under a perfectly good press, and
        // only a press that is rough both times is reported.
        let flagged = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
        if (!first) await fresh(page, startUrl);
        first = false;
        const sel = `[data-audit-press="${idx}"]`;
        const el = page.locator(sel).first();
        if (!(await el.count())) { if (process.env.DEBUG) console.log(pg, idx, "gone"); continue; }
        // Bring it to the middle of the screen at once (this is set-up, not the press), and only press it if nothing is lying over it.
        const spot = await el.evaluate((e) => {
          document.documentElement.style.scrollBehavior = "auto"; e.scrollIntoView({ block: "center", inline: "nearest" });
          const r = e.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2;
          const top = document.elementFromPoint(x, y);
          const ok = top && (e === top || e.contains(top) || top.contains(e)) && x > 0 && y > 0 && x < innerWidth && y < innerHeight;
          return ok ? { x, y } : { why: `${top?.nodeName}.${String(top?.className).slice(0, 40)} at ${Math.round(x)},${Math.round(y)} of ${innerWidth}x${innerHeight}` };
        });
        if (!spot || spot.why) { if (process.env.DEBUG) console.log(pg, idx, "covered", spot?.why); continue; }
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = ""; });
        await page.waitForTimeout(450);
        const what = await el.evaluate((e) => `${e.nodeName.toLowerCase()}[${(e.getAttribute("aria-label") || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 36)}]`);
        // Start the frame recorder, press, let it run.
        await page.evaluate((s) => {
          const e = document.querySelector(s); const frames = []; const t0 = performance.now();
          window.__rec = { frames, done: false, y0: scrollY, top0: e.getBoundingClientRect().top, h0: document.documentElement.scrollHeight, e };
          const tick = () => {
            const r = window.__rec.e.isConnected ? window.__rec.e.getBoundingClientRect() : null;
            frames.push({ t: performance.now() - t0, y: scrollY, top: r ? r.top : null, h: document.documentElement.scrollHeight, head: Boolean(document.querySelector("main h1, main h2, #main-content h1, #main-content h2")) });
            if (performance.now() - t0 < 700) requestAnimationFrame(tick); else window.__rec.done = true;
          };
          requestAnimationFrame(tick);
        }, sel);
        await page.mouse.click(spot.x, spot.y);
        await page.waitForFunction(() => window.__rec?.done, null, { timeout: 4000 }).catch(() => {});
        const rec = await page.evaluate(() => { const r = window.__rec; return { frames: r.frames, y0: r.y0, top0: r.top0, h0: r.h0 }; });
        pressed += 1;
        const moved = page.url() !== startUrl;
        const problems = [];
        // Judged on the screen, as the visitor sees it. Two things are rough: the pressed control being shoved 60 px or more within a few frames while the page did not scroll (the layout
        // moved under the finger), and a short scroll (under 3000 px) that happens in one or two frames instead of gliding, which leaves the control somewhere else. A scroll the browser
        // makes to keep the control still when content below it shrinks is not a jump, and a long scroll down to a chart is allowed to be quick.
        let prevTop = rec.top0; let prevY = rec.y0; let moving = 0; let biggest = 0; let scrolling = 0;
        for (const f of rec.frames) {
          if (f.top !== null) { const d = Math.abs(f.top - prevTop); if (d > 0.5) { moving += 1; biggest = Math.max(biggest, d); } prevTop = f.top; }
          if (Math.abs(f.y - prevY) > 0.5) scrolling += 1; prevY = f.y;
        }
        const scrolled = Math.abs((rec.frames.at(-1)?.y ?? rec.y0) - rec.y0);
        // "Show 36 more" adds rows above its own button, "Print" re-lays the page out for paper and the text-size buttons rescale everything: the button moving is the point of these.
        const expected = /^(show|load|see)( \d+)? more|^print|^(larger|largest|smaller|smallest|reset)/i.test(what.replace(/^[a-z]+\[/, ""));
        if (!moved && !expected && moving <= 3 && biggest >= 60 && scrolled < 40) problems.push(`the pressed control was shoved ${Math.round(biggest)} px by the layout in ${moving} frame${moving === 1 ? "" : "s"}`);
        if (!moved && !expected && scrolling >= 1 && scrolling <= 2 && scrolled >= 40 && scrolled <= 3000 && biggest >= 40) problems.push(`the page jumped ${Math.round(scrolled)} px in ${scrolling} frame${scrolling === 1 ? "" : "s"}`);
        // A page that becomes too short to hold where the visitor was standing is thrown back up the screen (the footer flashes past); a tall list swapped for a short one below is fine.
        const vh = PHONE ? 844 : 800;
        // A press that swaps the whole view for another and puts the reader back at the top (a list for one person's page) is a change of page, not a collapse: it is judged by where the page ends.
        const endsAtTop = (rec.frames.at(-1)?.y ?? rec.y0) < 5 && rec.y0 >= 5;
        if (!moved && !endsAtTop && rec.frames.some((f) => f.h < rec.h0 - 200 && f.h < rec.y0 + vh)) problems.push("page became too short for where the visitor was standing");
        if (!moved && rec.frames.some((f) => !f.head)) problems.push("page heading missing for a frame");
        if (!problems.length) { flagged = null; break; }
        flagged = { pg, what, problems };
        }
        if (flagged) results.push(flagged);
      }
    } catch (e) { results.push({ pg, what: "(page)", problems: [e.message.split("\n")[0]] }); }
    await page.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();

results.sort((a, b) => a.pg.localeCompare(b.pg));
console.log(`Pressed ${pressed} controls (up to ${PER} on each of ${PAGES.length} pages)${PHONE ? " on a phone" : ""}. ${results.length} presses to look at.\n`);
for (const r of results) console.log(`${r.pg}: ${r.what}: ${r.problems.join("; ")}`);
if (process.env.GITHUB_ACTIONS) for (const r of results) console.log(`::error title=Press feels rough::${r.pg}: ${r.what}: ${r.problems.join("; ")}`);
process.exit(results.length ? 1 : 0);

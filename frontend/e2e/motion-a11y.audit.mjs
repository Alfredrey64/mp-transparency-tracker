// Opens every page the way a visitor who has asked their device for less motion would, scrolls it top to bottom, and fails on two things:
//   - motion that carries on anyway: an animation still running (or an infinite one) on an element that is on screen, other than a loading spinner or a skeleton placeholder.
//     Pages already handle `prefers-reduced-motion` in their stylesheets, so a hit means a diagram or counter that was added without it.
//   - a diagram a screen reader cannot use: a visible <svg> of any size that is neither hidden from assistive technology (aria-hidden) nor given a name (role="img" with an
//     aria-label or <title>, or aria-labelledby), and is not inside an element that already is named or hidden. A bare drawing is read out as nothing, or as a run of shapes.
// Usage: node e2e/motion-a11y.audit.mjs [baseUrl]   (ONLY=a,b limits the pages; WORKERS=3 sets how many run at once; SVG=0 skips the diagram check)
// Needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`.
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const base = process.argv[2] ?? "http://localhost:4178";
const ONLY = process.env.ONLY?.split(",");
const WORKERS = Number(process.env.WORKERS ?? 3);
const CHECK_SVG = process.env.SVG !== "0";
const PAGES = ["home", ...PAGE_NAMES].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));
// Placeholders and spinners are allowed to move: they say "loading", which is information, and they stop when the page has loaded.
const ALLOWED = /spin|skeleton|shimmer|loading|placeholder|pulse/i;

const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  while (next < PAGES.length) {
    const pg = PAGES[next++];
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    try {
      await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForSelector("h1", { timeout: 20000 });
      await page.waitForTimeout(1500);
      const found = await page.evaluate(async ({ allowed, checkSvg }) => {
        const allow = new RegExp(allowed, "i");
        const label = (el) => `${el.nodeName.toLowerCase()}${el.className?.baseVal ?? el.className ? `.${String(el.className?.baseVal ?? el.className).trim().split(/\s+/).slice(0, 2).join(".")}` : ""}`;
        const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; };
        const moving = new Map();
        const sample = () => {
          for (const a of document.getAnimations()) {
            const el = a.effect?.target;
            if (!(el instanceof Element) || !onScreen(el)) continue;
            const t = a.effect.getComputedTiming();
            // A transition or an animation that lasts a hundredth of a second or less is how "no motion" is usually written; only real movement counts.
            if (a.playState !== "running" || (t.activeDuration !== Infinity && t.activeDuration <= 20)) continue;
            if (allow.test(label(el)) || allow.test(el.closest("[class]")?.className?.toString?.() ?? "")) continue;
            // A short fade is allowed (it moves nothing; this is what "reduce" still permits). Anything that travels, turns, scales or never stops is not.
            const props = new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)));
            const travels = [...props].some((k) => /transform|translate|scale|rotate|top|left|right|bottom|width|height|margin|stroke-dash|offset-distance|d$/i.test(k));
            if (!travels && t.iterations !== Infinity) continue;
            moving.set(`${label(el)} (${a.animationName ?? a.transitionProperty ?? "animation"}${t.iterations === Infinity ? ", endless" : ""})`, true);
          }
        };
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < Math.min(h, 12000); y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 160)); sample(); }
        const unnamed = [];
        if (checkSvg) {
          for (const svg of document.querySelectorAll("svg")) {
            if (!onScreenOrBelow(svg)) continue;
            if (svg.closest("[aria-hidden='true'], [role='img'], [role='presentation']")) continue;
            const named = svg.getAttribute("aria-label") || svg.getAttribute("aria-labelledby") || (svg.getAttribute("role") === "img" && svg.querySelector("title"));
            if (named || svg.getAttribute("aria-hidden") === "true") continue;
            // An icon inside a button or link that has its own text is part of that name, and is read out with it.
            const holder = svg.closest("button, a, [role='button'], [role='tab'], summary, label");
            if (holder && (holder.textContent.trim() || holder.getAttribute("aria-label"))) continue;
            // An svg with no text and no size is a spacer or a filter definition.
            const r = svg.getBoundingClientRect(); if (r.width < 6 || r.height < 6) continue;
            unnamed.push(`${label(svg)} ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        }
        function onScreenOrBelow(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
        return { moving: [...moving.keys()].slice(0, 6), unnamed: [...new Set(unnamed)].slice(0, 6), unnamedCount: unnamed.length };
      }, { allowed: ALLOWED.source, checkSvg: CHECK_SVG });
      results.push({ pg, ...found });
    } catch (e) { results.push({ pg, error: e.message.split("\n")[0] }); }
    await page.close();
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();

const bad = results.filter((r) => r.error || r.moving.length || r.unnamed.length).sort((a, b) => a.pg.localeCompare(b.pg));
console.log(`Opened ${PAGES.length} pages with reduced motion on. ${bad.length} to look at.\n`);
for (const r of bad) {
  if (r.error) console.log(`${r.pg}: ${r.error}`);
  if (r.moving?.length) console.log(`${r.pg}: still moving with reduced motion on: ${r.moving.join("; ")}`);
  if (r.unnamed?.length) console.log(`${r.pg}: ${r.unnamedCount} unnamed diagram${r.unnamedCount === 1 ? "" : "s"}: ${r.unnamed.join("; ")}`);
}
if (process.env.GITHUB_ACTIONS) for (const r of bad) console.log(`::error title=Motion and diagrams::${r.pg}: ${r.error ?? [...(r.moving ?? []), ...(r.unnamed ?? [])].join("; ")}`);
process.exit(bad.length ? 1 : 0);

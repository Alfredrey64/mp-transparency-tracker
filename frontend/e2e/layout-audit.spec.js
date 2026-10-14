import { test, expect } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";

// Opens every page at the screen sizes people actually use, from a phone to an ultrawide monitor, and checks what can be checked by machine:
// nothing pokes out sideways, there is one main heading, nothing throws, no image is broken, nothing is smaller than a finger can hit on a
// touch screen, and no paragraph stretches into an unreadable line on a very wide screen, and no row of boxes leaves one box on its own in the last row. It cannot judge looks, so `npm run shots` saves
// pictures of the same pages for a person to look at.

const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
const TABS = ["generalElection/history/1997", "generalElection/governments/blair", "taxRates", "taxRates/where", "taxRates/vat", "inequality/income", "inequality/wealth", "inequality/poverty", "inequality/place", "inequality/groups", "inequality/debate", "taxRates/council-tax", "taxRates/income-tax", "taxRates/government/thatcher", "taxRates/pay", "taxRates/budget", "taxRates/compare/incomeTax.basic/growth", "glossary", "settings"];
const SIZES = [
  { name: "phone", width: 390, height: 844, touch: true },
  { name: "tablet portrait", width: 820, height: 1180, touch: true },
  { name: "tablet landscape", width: 1180, height: 820, touch: true },
  { name: "laptop", width: 1366, height: 768, touch: false },
  { name: "desktop", width: 1920, height: 1080, touch: false },
  { name: "ultrawide", width: 3440, height: 1440, touch: false },
];
const MAX_LINE_PX = 1100;

// Runs in the page. Reports anything that sticks out past the edge of the page outside a scrolling box, broken images, tiny touch targets and over-long paragraphs.
function audit({ touch, maxLine }) {
  const doc = document.documentElement;
  const out = { overflow: [], broken: [], small: [], longLines: [], orphans: [] };
  const scrolls = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true;
    }
    return false;
  };
  const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : ""} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)}"`;
  for (const el of document.body.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if ((r.right > doc.clientWidth + 1 || (r.left < -1 && r.right > 0)) && s.position !== "fixed" && !scrolls(el)) out.overflow.push(`${label(el)} spans ${Math.round(r.left)} to ${Math.round(r.right)}`);
    if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0 && !el.closest("[aria-hidden='true']")) out.broken.push(el.currentSrc || el.src);
    if (el.tagName === "P" && r.width > maxLine && el.textContent.trim().length > 120) out.longLines.push(`${label(el)} is ${Math.round(r.width)} wide`);
  }
  // Touch targets: at least 24 by 24 pixels (WCAG 2.2, 2.5.8), unless the link sits inside a sentence, or the target is small but far enough from every
  // other target that a 24 pixel square around it overlaps none of theirs.
  if (touch) {
    const sel = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab]";
    const all = [...document.body.querySelectorAll(sel)].filter((e) => e.offsetParent !== null && !e.closest(".sr-only, .skip-link"));
    // Buttons get an invisible larger area to tap on touch screens (see the pointer: coarse rule in index.css), so that area is what counts for them.
    const grown = (e) => (e.tagName === "BUTTON" && !e.classList.contains("gloss-term") ? { x: 6, y: 8 } : { x: 0, y: 0 });
    const box = (e) => { const r = e.getBoundingClientRect(); const g = grown(e); const w = Math.max(r.width + g.x * 2, 24); const h = Math.max(r.height + g.y * 2, 24); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2; return { l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 }; };
    for (const el of all) {
      const r = el.getBoundingClientRect();
      const g = grown(el);
      if (r.width + g.x * 2 >= 23.5 && r.height + g.y * 2 >= 23.5) continue;
      const block = el.closest("p, li, dd, td, div");
      const inSentence = el.classList.contains("gloss-term") || (getComputedStyle(el).display === "inline" && block && block.textContent.trim().length > el.textContent.trim().length + 12);
      if (inSentence) continue;
      const a = box(el);
      const crowded = all.some((o) => o !== el && !el.contains(o) && !o.contains(el) && (() => { const b = box(o); return Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0.5; })());
      if (crowded) out.small.push(`${label(el)} is ${Math.round(r.width)} by ${Math.round(r.height)}`);
    }
  }
  // A row of three to eight equal boxes must not leave a lone or lopsided last row: the last row is either as full as the rows above or centred under them.
  for (const el of document.body.querySelectorAll("*")) {
    if (!(el instanceof HTMLElement) || el.children.length < 3 || el.children.length > 8 || el.closest("svg")) continue;
    const kids = [...el.children];
    const rects = kids.map((k) => k.getBoundingClientRect());
    if (!kids.every((k, i) => rects[i].width >= 80 && rects[i].height >= 40 && !/^(none)$/.test(getComputedStyle(k).display) && !/(absolute|fixed)/.test(getComputedStyle(k).position))) continue;
    if (!rects.every((r) => Math.abs(r.width - rects[0].width) < 3)) continue;
    const rows = [];
    for (const r of rects) {
      const row = rows.find((x) => Math.abs(x.top - r.top) < 6);
      if (row) { row.n += 1; row.l = Math.min(row.l, r.left); row.r = Math.max(row.r, r.right); } else rows.push({ top: r.top, n: 1, l: r.left, r: r.right });
    }
    if (rows.length < 2 || rows.at(-1).n >= rows[0].n) continue;
    const centred = Math.abs(rows.at(-1).l - rows[0].l - (rows[0].r - rows.at(-1).r)) < 6;
    if (!centred) out.orphans.push(`${label(el)} has ${kids.length} boxes in rows of ${rows.map((r) => r.n).join(", ")}`);
  }
  return out;
}

for (const size of SIZES) {
  test.describe(`${size.name}, ${size.width} by ${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch && size.width < 800 });

    for (const view of [...PAGES, ...TABS].filter((v, i, all) => all.indexOf(v) === i)) {
      test(`${view} is laid out properly`, async ({ page }) => {
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
        await page.goto(view === "home" ? "/" : `/${view}`);
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(700);

        const base = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, h1s: document.querySelectorAll("h1").length }));
        const found = await page.evaluate(audit, { touch: size.touch, maxLine: MAX_LINE_PX });

        expect(base.scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(base.clientWidth);
        expect(base.h1s, "each page has one main heading").toBe(1);
        expect(found.overflow.slice(0, 5), "elements poking out of the page").toEqual([]);
        expect(found.broken, "broken images").toEqual([]);
        expect(found.small.slice(0, 5), "touch targets under 24 pixels").toEqual([]);
        expect(found.orphans.slice(0, 5), "rows of boxes with a lone or left-over last row").toEqual([]);
        expect(found.longLines.slice(0, 5), `paragraphs wider than ${MAX_LINE_PX} pixels`).toEqual([]);
        expect(errors, "no uncaught errors").toEqual([]);
      });
    }
  });
}

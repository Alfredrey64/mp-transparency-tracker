import { test, expect } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";

// Opens every page at the screen sizes people actually use, from a phone to an ultrawide monitor, and checks what can be checked by machine:
// nothing pokes out sideways, there is one main heading, nothing throws, no image is broken, nothing is smaller than a finger can hit on a
// touch screen, and no paragraph stretches into an unreadable line on a very wide screen. It cannot judge looks, so `npm run shots` saves
// pictures of the same pages for a person to look at.

const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
const TABS = ["generalElection/history/1997", "generalElection/governments/blair", "taxRates/vat", "taxRates/council-tax", "taxRates/income-tax", "taxRates/government/thatcher", "taxRates/pay", "taxRates/budget", "taxRates/compare/incomeTax.basic/growth", "glossary", "settings"];
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
  const out = { overflow: [], broken: [], small: [], longLines: [] };
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
    if ((r.right > doc.clientWidth + 1 || r.left < -1) && s.position !== "fixed" && !scrolls(el)) out.overflow.push(`${label(el)} spans ${Math.round(r.left)} to ${Math.round(r.right)}`);
    if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0 && !el.closest("[aria-hidden='true']")) out.broken.push(el.currentSrc || el.src);
    if (touch && (el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "INPUT") && el.offsetParent !== null) {
      const inline = el.tagName === "A" && s.display === "inline" && el.closest("p, li, span, td, div[class]") && el.textContent.trim().split(" ").length > 3;
      if (!inline && (r.width < 24 || r.height < 24) && !el.closest(".sr-only, .skip-link")) out.small.push(`${label(el)} is ${Math.round(r.width)} by ${Math.round(r.height)}`);
    }
    if (el.tagName === "P" && r.width > maxLine && el.textContent.trim().length > 120) out.longLines.push(`${label(el)} is ${Math.round(r.width)} wide`);
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
        await page.goto(view === "home" ? "/" : `/#/${view}`);
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(700);

        const base = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, h1s: document.querySelectorAll("h1").length }));
        const found = await page.evaluate(audit, { touch: size.touch, maxLine: MAX_LINE_PX });

        expect(base.scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(base.clientWidth);
        expect(base.h1s, "each page has one main heading").toBe(1);
        expect(found.overflow.slice(0, 5), "elements poking out of the page").toEqual([]);
        expect(found.broken, "broken images").toEqual([]);
        expect(found.small.slice(0, 5), "touch targets under 24 pixels").toEqual([]);
        expect(found.longLines.slice(0, 5), `paragraphs wider than ${MAX_LINE_PX} pixels`).toEqual([]);
        expect(errors, "no uncaught errors").toEqual([]);
      });
    }
  });
}

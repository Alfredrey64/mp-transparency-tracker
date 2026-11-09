import { test, expect, devices } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";

// Tests in Safari's engine (WebKit) on an iPad and an iPhone, with real touch taps. Chrome and Safari write inline styles differently, and a rule that worked in one broke taps in
// the other: on touch screens every button gets an invisible larger tap area (button::after), and in Safari that area was left unanchored and covered the whole page, so the
// toggles on People and places pages did nothing when tapped. Nothing run in Chrome could show it, so these run in WebKit.

test.use({ browserName: "webkit" });

// A device from Playwright's list (its own choice of browser is dropped: the whole file runs in WebKit).
const ios = (name) => Object.fromEntries(Object.entries(devices[name]).filter(([k]) => k !== "defaultBrowserType"));

const PAGES = ["home", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
const PEOPLE_AND_PLACES = ["population", "immigration", "inequality", "deprivation", "regions"];
const TOGGLES = '#main-content :is([role=radio], [role=switch], [role=tab], button[aria-pressed], button[aria-expanded])';

async function open(page, path) {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto(`/${path === "home" ? "" : path}`);
  await expect(page.locator("main h1, h1").first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}

// A button's invisible tap area may reach a little past it, never across the page.
const oversizedTapAreas = (page) => page.evaluate(() => [...document.querySelectorAll("button")].flatMap((b) => {
  const as = getComputedStyle(b, "::after");
  if (as.content === "none" || as.position !== "absolute") return [];
  // The button's own layout size: getBoundingClientRect shrinks with a tile that is still scaling in (the tax tiles pop in), while the tap area's computed size does not, so a slow
  // machine caught a tile part way through and reported a button 80% of its size.
  const r = { width: b.offsetWidth, height: b.offsetHeight };
  if (r.width === 0 || r.height === 0) return [];
  const w = parseFloat(as.width), h = parseFloat(as.height);
  return w > r.width + 24 || h > r.height + 24 ? [`${(b.innerText || b.getAttribute("aria-label") || b.className).trim().slice(0, 40)}: tap area ${Math.round(w)}x${Math.round(h)} on a ${Math.round(r.width)}x${Math.round(r.height)} button`] : [];
}));

// Every toggle, once scrolled to the middle of the screen, is what a finger on its centre lands on.
const coveredToggles = (page) => page.evaluate((sel) => [...document.querySelectorAll(sel)].flatMap((el) => {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || el.closest("[inert], [aria-hidden=true], details:not([open]) > :not(summary)")) return [];
  el.scrollIntoView({ block: "center", inline: "center" });
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return [];
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!top || el === top || el.contains(top) || top.contains(el)) return [];
  return [`${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40)} is covered by ${top.tagName.toLowerCase()} "${(top.textContent || "").trim().slice(0, 30)}"`];
}), TOGGLES);

test.describe("iPad, portrait", () => {
  test.use(ios("iPad Pro 11"));
  for (const view of PAGES) {
    test(`${view}: no button has a tap area that spills over its neighbours`, async ({ page }) => {
      await open(page, view);
      expect(await oversizedTapAreas(page)).toEqual([]);
    });
  }
});

for (const [name, device, landscape] of [["iPad, portrait", "iPad Pro 11", false], ["iPad, landscape", "iPad Pro 11", true], ["iPhone", "iPhone 14", false]]) {
  test.describe(`${name}: People and places toggles`, () => {
    const d = ios(device);
    test.use({ ...d, ...(landscape ? { viewport: { width: d.viewport.height, height: d.viewport.width } } : {}) });
    for (const view of PEOPLE_AND_PLACES) {
      test(`${view}: every toggle can be reached by a finger`, async ({ page }) => {
        await open(page, view);
        expect(await coveredToggles(page)).toEqual([]);
      });
    }
  });
}

test.describe("iPad: tapping a toggle changes it", () => {
  test.use(ios("iPad Pro 11"));
  test("the range and switch toggles on the Population page respond to a tap", async ({ page }) => {
    await open(page, "population");
    const range = page.getByRole("radio", { name: "5 years", exact: true });
    await range.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await range.tap();
    await expect(range).toHaveAttribute("aria-checked", "true");
    const gov = page.getByRole("switch", { name: "Show who was in government" });
    await gov.tap();
    await expect(gov).toHaveAttribute("aria-checked", "true");
    await gov.tap();
    await expect(gov).toHaveAttribute("aria-checked", "false");
  });
});

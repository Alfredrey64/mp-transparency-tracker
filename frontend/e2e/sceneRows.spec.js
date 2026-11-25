import { test, expect } from "@playwright/test";

// The pictures along the foot of the Britain in numbers heading bands: on every screen each is shown whole, in one row, scaled to fit the width at its own shape (1440 x 200). It is never cropped
// to its middle or split into two rows on a phone, and the second copy of the picture is always hidden (heroscene.css).
const PAGES = ["economy", "jobs", "publicFinances", "taxRates", "business", "farming", "education", "transport", "justice", "crime", "digital", "energy", "environment", "water", "flooding"];

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  for (const name of PAGES) {
    test(`${name}: the picture is shown whole in one row that fits the screen`, async ({ page }) => {
      await page.goto(`/${name}`);
      const rows = page.locator(".hs-scene svg.scene-row, .fm-scene svg.scene-row");
      await expect(rows).toHaveCount(2);
      const [a] = await rows.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); const box = e.parentElement.getBoundingClientRect(); return { h: r.height, w: r.width, boxW: box.width, boxH: box.height, left: r.left - box.left }; }));
      expect(await rows.evaluateAll((els) => els.map((e) => getComputedStyle(e).display))).toEqual(["block", "none"]);
      expect(Math.abs(a.w / a.h - 1440 / 200)).toBeLessThan(0.2); // the picture keeps its own shape
      expect(Math.abs(a.w - a.boxW)).toBeLessThan(2); // and fills the width exactly: nothing is cut off at the sides
      expect(Math.abs(a.left)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});

test("on a wide screen the picture is one row", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/economy");
  await expect(page.locator(".hs-scene svg.scene-row")).toHaveCount(2);
  const shown = await page.locator(".hs-scene svg.scene-row").evaluateAll((els) => els.map((e) => getComputedStyle(e).display));
  expect(shown).toEqual(["block", "none"]);
});

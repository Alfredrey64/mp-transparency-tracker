import { test, expect } from "@playwright/test";

// The pictures along the foot of the Britain in numbers heading bands: on a small phone each is shown whole in two rows (the left part, then the right part of the landscape) instead of cut to its
// middle; everywhere else it is one row and the second copy is hidden (heroscene.css).
const PAGES = ["economy", "jobs", "publicFinances", "taxRates", "business", "farming", "education", "transport", "justice", "crime", "digital", "energy", "environment", "water", "flooding"];

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  for (const name of PAGES) {
    test(`${name}: the picture is shown whole in two rows that fit the screen`, async ({ page }) => {
      await page.goto(`/${name}`);
      const rows = page.locator(".hs-scene svg.scene-row, .fm-scene svg.scene-row");
      await expect(rows).toHaveCount(2);
      const [a, b] = await rows.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); const box = e.parentElement.getBoundingClientRect(); return { top: r.top, h: r.height, w: r.width, boxW: box.width, left: r.left - box.left }; }));
      expect(a.h).toBeGreaterThan(80);
      expect(Math.abs(a.h - b.h)).toBeLessThan(1);
      expect(b.top).toBeGreaterThan(a.top + a.h - 1); // the second row sits under the first
      expect(a.boxW).toBeLessThanOrEqual(391);
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

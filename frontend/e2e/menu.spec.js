import { test, expect } from "@playwright/test";

// The menus end inside the window: the last page of a group is never left below the edge of the screen.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("on a phone, every group in the menu opens with its last page in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const groups = page.locator(".drawer-group");
  const n = await groups.count();
  expect(n).toBeGreaterThan(5);
  for (let i = 0; i < n; i++) {
    await groups.nth(i).locator("> button").click();
    await page.waitForTimeout(1300);
    // A group that fits is shown whole; one taller than the menu is shown from its heading, and the menu scrolls for the rest.
    const seen = await page.evaluate((k) => {
      const g = document.querySelectorAll(".drawer-group")[k].getBoundingClientRect();
      const p = document.querySelector(".site-drawer").getBoundingClientRect();
      const fits = g.height <= p.height - 24;
      return fits ? { ok: g.bottom <= p.bottom && g.top >= p.top, fits } : { ok: g.top >= p.top - 1 && g.top <= p.top + 60, fits };
    }, i);
    expect(seen.ok, `group ${i} (fits: ${seen.fits}) is in view`).toBe(true);
  }
});

test("on a short laptop screen, each dropdown panel ends inside the window", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto("/");
  const heads = page.locator("header .site-bar button[aria-expanded]:visible").filter({ hasNot: page.locator(".site-burger") });
  const n = await heads.count();
  expect(n).toBeGreaterThanOrEqual(5);
  for (let i = 0; i < 5; i++) {
    await heads.nth(i).hover();
    await page.waitForSelector(".site-mega", { timeout: 4000 });
    await page.waitForTimeout(400);
    const bottom = await page.evaluate(() => Math.round(document.querySelector(".site-mega").getBoundingClientRect().bottom));
    expect(bottom, `panel ${i} bottom`).toBeLessThanOrEqual(640);
    await page.mouse.move(5, 300);
    await page.waitForTimeout(350);
  }
});

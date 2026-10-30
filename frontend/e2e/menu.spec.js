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

test("the English header never lets a menu run under the search box, at any width", async ({ page }) => {
  // 1261 is the narrowest width that keeps the full menus; a Windows or Linux scrollbar takes 15px of it, so the test measures with that much taken away.
  for (const width of [1261, 1280, 1320, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.addStyleTag({ content: "html { overflow-y: scroll; } ::-webkit-scrollbar { width: 15px; }" });
    await expect(page.locator(".site-burger")).toBeHidden();
    const gap = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".site-nav button, .site-nav a")].filter((e) => e.offsetParent);
      const last = items.at(-1).getBoundingClientRect().right;
      return Math.round(document.querySelector(".site-search-btn").getBoundingClientRect().left - last);
    });
    expect(gap, `${width}px: space between the last menu and search`).toBeGreaterThanOrEqual(8);
  }
});

test("below 1260px the menus fold into the menu button", async ({ page }) => {
  await page.setViewportSize({ width: 1250, height: 800 });
  await page.goto("/");
  await expect(page.locator(".site-burger")).toBeVisible();
  await expect(page.locator(".site-nav")).toBeHidden();
});

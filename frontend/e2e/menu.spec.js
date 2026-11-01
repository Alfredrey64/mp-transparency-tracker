import { test, expect } from "@playwright/test";

// The phone menu stays where it is when a group is opened: it never scrolls by itself.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("on a phone, opening a group in the menu does not scroll the menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const groups = page.locator(".drawer-group");
  const n = await groups.count();
  expect(n).toBeGreaterThan(5);
  for (const i of [n - 1, 3, 0]) {
    // The click is sent from inside the page, so the test itself never scrolls the menu to reach the button.
    const before = await page.evaluate(() => document.querySelector(".site-drawer").scrollTop);
    await groups.nth(i).locator("> button").evaluate((el) => el.click());
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => document.querySelector(".site-drawer").scrollTop), `group ${i}`).toBe(before);
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

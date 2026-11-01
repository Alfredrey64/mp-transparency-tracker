import { test, expect } from "@playwright/test";

// Changing page fades the page's content out, swaps it while it is invisible and fades the new one in. The header is never part of that, so it cannot appear
// doubled, and the new page opens at its top.
test("changing page opens the new page at its top, settles to full opacity and leaves no fade state behind", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/care");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(300);

  // A link clicked where the visitor is, without the test scrolling it into view first.
  const link = page.getByRole("link", { name: "Ageing and pensions" }).first();
  await link.evaluate((el) => el.click());

  await expect(page).toHaveURL(/\/ageing/);
  await expect(page.locator("h1").first()).toContainText("Ageing and pensions");
  expect(await page.evaluate(() => Math.round(scrollY)), "the new page opens at its top").toBe(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.leaving ?? "none"), { timeout: 5000 }).toBe("none");
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector("#main-content")).opacity)), { timeout: 5000 }).toBe(1);
  expect(await page.locator(".site-header").count(), "one header").toBe(1);
});

test("two quick clicks end on the second page, fully visible", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/care");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: "Ageing and pensions" }).first().evaluate((el) => el.click());
  await page.getByRole("link", { name: "The NHS" }).first().evaluate((el) => el.click());
  await expect(page).toHaveURL(/\/nhs/);
  await expect(page.locator("h1").first()).toContainText("NHS");
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector("#main-content")).opacity)), { timeout: 5000 }).toBe(1);
  expect(await page.evaluate(() => document.documentElement.dataset.leaving ?? "none")).toBe("none");
});

// A page with dozens of charts draws the first few with the page and the rest soon after, so changing to it is quick. Asking for a chart that is not there yet
// (from the "Jump to" list) draws them all first.
test("a long page of charts draws the rest after the first few, and a jump to a late chart finds it", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/housing");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  const cards = () => page.locator(".ons-cards > [id^='s-']").count();
  const first = await expect.poll(cards, { timeout: 5000 }).toBeGreaterThan(0).then(cards);
  await expect.poll(cards, { timeout: 15000 }).toBeGreaterThan(first);

  // A fresh visit, then straight to the last chart on the list.
  await page.goto("/housing");
  await expect(page.locator("#ons-jump-select")).toBeVisible({ timeout: 15000 });
  const last = await page.locator("#ons-jump-select option").last().getAttribute("value");
  await page.selectOption("#ons-jump-select", last);
  await expect(page.locator(`#s-${last}`)).toBeAttached();
});

// Pop-outs ease away instead of vanishing: closing marks them as closing for a moment, then they are gone and focus is back on the button.
test("the search box and the accessibility panel ease away when closed, then are gone", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/care");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  for (const [open, layer] of [[".site-search-btn", ".search-layer"], [".site-access", ".ax-layer"]]) {
    await page.locator(open).click();
    await expect(page.locator(layer)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(`${layer}[data-closing]`)).toHaveCount(1);
    await expect(page.locator(layer)).toHaveCount(0);
  }
});

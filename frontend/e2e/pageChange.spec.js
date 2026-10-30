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

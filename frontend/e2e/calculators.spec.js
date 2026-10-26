import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
});

test("the take-home calculator works out pay for a typed salary and a Scottish taxpayer", async ({ page }) => {
  await page.goto("/calculators");
  const input = page.locator("#calc-salary");
  await input.fill("30000");
  // £30,000: £3,486 income tax and £1,393 National Insurance leaves £25,121.
  await expect(page.locator("#calc-panel")).toContainText("£25,121");
  await page.getByRole("radio", { name: "Scotland" }).click();
  await expect(page.locator("#calc-panel")).not.toContainText("£25,121");
  await expect(page.locator("#calc-panel")).toContainText("£");
});

test("the stamp duty calculator follows the price and the kind of buyer", async ({ page }) => {
  await page.goto("/calculators/stamp");
  await page.locator("#calc-price").fill("400000");
  await expect(page.locator("#calc-panel")).toContainText("£10,000");
  await page.getByRole("radio", { name: "First-time buyer" }).click();
  await expect(page.locator("#calc-panel")).toContainText("£5,000");
  await page.locator("#calc-price").fill("600000");
  await expect(page.locator("#calc-panel")).toContainText("First-time buyer relief stops");
});

test("the calculators page does not scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ["/calculators", "/calculators/stamp", "/funding"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test("changing page cross-fades and ends on the new page at its top, with the address changed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.locator('a[href="/howitworks"]').first().click({ force: true });
  await expect(page.locator("h1")).toHaveText("How Parliament works");
  expect(new URL(page.url()).pathname).toBe("/howitworks");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.vt ?? "")).toBe("");
  await page.goBack();
  await expect(page.locator("h1")).toContainText("A simple breakdown of UK politics");
});

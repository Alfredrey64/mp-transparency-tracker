import { test, expect } from "@playwright/test";

// Page addresses are real paths. Old hash addresses are turned into paths, links move between pages without reloading, and the browser's back and
// forward buttons work.

test.beforeEach(async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
});

test("an old hash address opens the page and becomes a path", async ({ page }) => {
  await page.goto("/#/taxRates/vat");
  await expect(page.locator("h1").first()).toHaveText("Taxes");
  await expect(page).toHaveURL(/\/taxRates\/vat$/);
  await expect(page.locator("#h-tax-detail")).toHaveText("VAT");
});

test("a path opens its page, with the page's own title", async ({ page }) => {
  await page.goto("/taxRates/alcohol");
  await expect(page.locator("#h-tax-detail")).toHaveText("Alcohol duty");
  await expect(page).toHaveTitle(/Taxes/);
  await expect(page).toHaveURL(/\/taxRates\/alcohol$/);
});

test("the old Taxes and spending and Where taxes go addresses open the Taxes page", async ({ page }) => {
  await page.goto("/tax");
  await expect(page.locator("h1").first()).toHaveText("Taxes");
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await page.goto("/budget");
  await expect(page.getByRole("tab", { name: "Where it goes" })).toHaveAttribute("aria-selected", "true");
});

test("a link between pages does not reload, and back and forward work", async ({ page }) => {
  await page.goto("/taxRates/income-tax");
  await expect(page.locator("#h-tax-detail")).toHaveText("Income tax");
  await page.evaluate(() => { window.__still_here = true; });
  await page.getByRole("link", { name: /Compare this with growth/ }).click();
  await expect(page).toHaveURL(/\/taxRates\/compare\/incomeTax\.basic\/growth$/);
  await expect(page.getByRole("tab", { name: "Compare" })).toHaveAttribute("aria-selected", "true");
  expect(await page.evaluate(() => window.__still_here)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/taxRates\/income-tax$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/taxRates\/compare/);
});

test("a path with a name in it opens that page", async ({ page }) => {
  await page.goto("/constituency/Holborn%20and%20St%20Pancras");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page).toHaveURL(/\/constituency\/Holborn%20and%20St%20Pancras$/);
});

test("an address the site does not know opens the home page", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

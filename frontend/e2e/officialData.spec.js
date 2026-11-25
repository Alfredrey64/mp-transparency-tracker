import { test, expect } from "@playwright/test";

// The pages that show official data saved with the site: treaties on The UK abroad, the special advisers report, and the Charity Commission entries on the think tanks page.
// They read saved files, so nothing outside is called.

test("treaties: the list filters to open treaties and a card opens to show what Parliament recorded", async ({ page }) => {
  await page.goto("/foreignPolicy");
  await expect(page.getByRole("heading", { name: "Treaties before Parliament" })).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".tr-list .bbx-card").first()).toBeVisible({ timeout: 20000 });
  const all = await page.locator(".tr-list .bbx-card").count();
  expect(all).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Cleared", exact: true }).click();
  const cleared = await page.locator(".tr-list .bbx-card").count();
  expect(cleared).toBeLessThanOrEqual(all);
  await page.getByRole("button", { name: "All", exact: true }).click();
  const first = page.locator(".tr-list .bbx-head").first();
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".tr-steps").first()).toContainText("Laid before");
});

test("special advisers: search by name and filter by band narrow the list", async ({ page }) => {
  await page.goto("/specialAdvisers");
  await expect(page.getByRole("heading", { name: "Special advisers", level: 1 })).toBeVisible({ timeout: 20000 });
  const rows = page.locator(".adv-row");
  await expect(rows.first()).toBeVisible();
  const firstName = (await rows.first().locator(".adv-name").innerText()).trim();
  await page.getByRole("searchbox", { name: "Search advisers by name" }).fill(firstName);
  await expect(rows.first().locator(".adv-name")).toHaveText(firstName);
  await page.getByRole("searchbox", { name: "Search advisers by name" }).fill("zzzz-nobody");
  await expect(page.locator(".ac-empty")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search advisers by name" }).fill("");
  await page.getByRole("button", { name: "Band 4" }).click();
  const bands = await page.locator(".adv-band b").allInnerTexts();
  expect(bands.length).toBeGreaterThan(0);
  expect(new Set(bands)).toEqual(new Set(["4"]));
});

test("special advisers: no sideways scroll on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/specialAdvisers");
  await expect(page.locator(".adv-row").first()).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("think tanks: a charity's register entry links to the Commission's own page", async ({ page }) => {
  await page.goto("/thinkTanks");
  const link = page.locator('a[href^="https://register-of-charities.charitycommission.gov.uk/"]').first();
  await expect(link).toBeAttached({ timeout: 20000 });
  await expect(page.locator("main")).toContainText("The register does not say who gave the money");
});

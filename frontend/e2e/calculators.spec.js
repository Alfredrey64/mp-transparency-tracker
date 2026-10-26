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

test("a stage of the bill route can be picked, and the panel and the marker follow", async ({ page }) => {
  await page.goto("/howitworks");
  await page.locator(".billroute").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Stage 4: Committee Stage" }).click();
  await expect(page.locator(".billroute-caption")).toContainText("Committee Stage");
  await expect(page.locator(".billroute-caption")).toContainText("Who decides");
  await page.getByRole("button", { name: "Next stage" }).click();
  await expect(page.locator(".billroute-caption")).toContainText("Report Stage");
});

test("choosing a tier in the diagram does not move the box or the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  await page.locator("#tiers").waitFor();
  await page.evaluate(() => document.querySelector("#tiers").scrollIntoView());
  await page.waitForTimeout(4500);
  const slab = page.locator(".tier-slab").nth(3);
  await slab.click();
  await page.waitForTimeout(700);
  const a = await slab.boundingBox();
  await page.waitForTimeout(1500);
  const b = await slab.boundingBox();
  expect(b).toEqual(a);
  // The explaining panel starts level with the top box.
  const tops = await page.evaluate(() => [document.querySelector(".tier-slab").getBoundingClientRect().top, document.querySelector(".tier-panel").getBoundingClientRect().top].map(Math.round));
  expect(tops[1]).toBe(tops[0]);
});

test("pages show a way on to the next ones in their group, and a list of their own headings", async ({ page }) => {
  await page.goto("/darkMoney");
  await expect(page.getByRole("navigation", { name: /More in/ })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.getByRole("button", { name: "On this page" }).click();
  await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
});

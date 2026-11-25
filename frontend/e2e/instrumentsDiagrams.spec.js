import { test, expect } from "@playwright/test";

// The pictures on the Laws made by ministers page: each can be pressed, says in words what it shows, and fits a phone.
test("the two-routes picture changes its result and its words when a route or outcome is chosen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  const fig = page.locator(".sir");
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator(".sir-res b")).toHaveText("It becomes law");
  await fig.getByRole("button", { name: "Parliament says no" }).click();
  await expect(fig.locator(".sir-res b")).toHaveText("It falls away");
  await expect(fig.locator(".sir-say")).toContainText("A draft never becomes law");
  await fig.getByRole("button", { name: "It goes ahead unless a House objects" }).click();
  await expect(fig.getByRole("button", { name: "A House objects", exact: true })).toBeVisible();
  await expect(fig.locator(".sir-check")).toContainText("40 days to object");
  await fig.getByRole("button", { name: "No House objects", exact: true }).click();
  await expect(fig.locator(".sir-res b")).toHaveText("It stands");
});

test("Parliament cannot change a line: the picture says so, and approve or reject act on the whole", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  const fig = page.locator(".sin");
  await fig.scrollIntoViewIfNeeded();
  await fig.getByRole("button", { name: "Try to change a line" }).click();
  await expect(fig.locator(".sin-say")).toContainText("cannot change the wording");
  await fig.getByRole("button", { name: "Reject it" }).click();
  await expect(fig.locator(".sin-say")).toContainText("Rejected as a whole");
});

test("the Act and instrument picture, the month chart, the four names and the real case are on the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  const fill = page.locator(".sif");
  await fill.scrollIntoViewIfNeeded();
  await fill.getByRole("button", { name: /The gap is filled/ }).click();
  await expect(fill.locator(".sif-say")).toContainText("fills the gap");

  const months = page.locator(".sim");
  await months.scrollIntoViewIfNeeded();
  await expect(months.locator(".sim-cols button")).toHaveCount(12);
  await months.locator(".sim-cols button").first().click();
  await expect(months.locator(".sim-read b")).toHaveText(/December 2025/);

  await expect(page.locator(".sig .sig-cell")).toHaveCount(4);
  await expect(page.locator(".sics .sics-list li")).toHaveCount(3);
  await expect(page.locator(".ib-strip").first()).toBeVisible();
});

test("the pictures fit a phone without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/statutoryInstruments");
  await page.locator(".sics").scrollIntoViewIfNeeded();
  const over = await page.evaluate(() => [".sif", ".sir", ".sin", ".sih", ".sic", ".sim", ".sig", ".sics"].map((s) => {
    const el = document.querySelector(s);
    return el && el.scrollWidth > el.clientWidth + 1 ? s : null;
  }).filter(Boolean));
  expect(over).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

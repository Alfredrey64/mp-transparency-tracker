import { test, expect } from "@playwright/test";

// The pictures and moves added on 24 November 2026: the Acts that have become law sit on the Bills page, the law and Speaker pages have their own pictures, and a popular question opens
// its answer without the page jumping.

test("the Acts that have become law are on the Bills page, not at the end of How a law is made", async ({ page }) => {
  await page.goto("/voting");
  await expect(page.getByRole("heading", { name: /The Acts that have become law in \d{4}/ })).toBeVisible();
  await page.goto("/howLawMade");
  await expect(page.getByRole("heading", { name: /The Acts that have become law/ })).toHaveCount(0);
  await expect(page.locator('a[href="#/voting"]').first()).toBeVisible();
  await expect(page.locator(".lwa svg")).toBeVisible();
});

test("the Speaker, whips and clerks plan moves its spotlight when a card is pressed", async ({ page }) => {
  await page.goto("/speakerWhipsClerks");
  const fig = page.locator(".swr");
  await expect(fig).toHaveAttribute("data-role", "speaker");
  await fig.getByRole("button", { name: /The whips/ }).click();
  await expect(fig).toHaveAttribute("data-role", "whips");
  await expect(fig.getByRole("button", { name: /The whips/ })).toHaveAttribute("aria-pressed", "true");
});

test("a popular question opens its answer in one step and the page stays put afterwards", async ({ page }) => {
  await page.goto("/answers");
  await page.getByRole("button", { name: "Why is the NHS waiting list so long?" }).click();
  await expect(page.locator("h2#h-answer")).toBeVisible();
  await page.waitForTimeout(1200);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(h);
});

test("Who they are shows seats for every MP and a ring for each group", async ({ page }) => {
  await page.goto("/numbers/who");
  await expect(page.locator(".wta-seat")).toHaveCount(650);
  await expect(page.locator(".wta-rings li")).toHaveCount(4);
});

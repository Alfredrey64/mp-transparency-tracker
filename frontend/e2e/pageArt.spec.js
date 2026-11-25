import { test, expect } from "@playwright/test";

// The pictures and moves added on 24 November 2026: the Acts that have become law sit at the end of How a law is made (moved there from the Bills page on 25 November), the law and Speaker pages have their own pictures, and a popular question opens
// its answer without the page jumping.

test("the Acts that have become law are at the end of How a law is made, not on the Bills page", async ({ page }) => {
  await page.goto("/voting");
  await expect(page.getByRole("heading", { name: /The Acts that have become law/ })).toHaveCount(0);
  await page.goto("/howLawMade");
  await expect(page.getByRole("heading", { name: /The Acts that have become law in \d{4}/ })).toBeVisible();
  await expect(page.locator(".lwr-st")).toHaveCount(12);
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

test("How a law is made: pressing a stop on the route map shows its stage, and the ping pong rally is drawn", async ({ page }) => {
  await page.goto("/howLawMade");
  const map = page.locator(".lwr");
  await map.getByRole("button", { name: /Stage 8 of 12/ }).click();
  await expect(map.locator('.lwr-panel[data-on="1"] h2')).toContainText("Lords: Committee stage");
  await expect(page.locator(".lwp svg")).toBeVisible();
});

test("an Act's dot on the How a law is made page opens a card with what it did", async ({ page }) => {
  await page.goto("/howLawMade");
  const dot = page.locator(".acp-dot").first();
  await dot.scrollIntoViewIfNeeded();
  await dot.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".acp-card")).toBeVisible();
  await expect(page.locator(".acp-card .acp-card-own")).toContainText("An Act");
  await page.keyboard.press("Escape");
  await expect(page.locator(".acp-card")).toHaveCount(0);
});

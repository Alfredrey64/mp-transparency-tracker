import { test, expect } from "@playwright/test";

// The opinion-poll banner, the Today top, and the cross inside round close buttons.

test("the opinion poll banner shows each party's votes and seats with the gap between them", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/polling");
  const cards = page.locator(".vv-vs-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Seats ahead of votes by 29.5 percentage points");
  await expect(cards.nth(1)).toContainText("Seats behind votes by 13.5 percentage points");
  await cards.first().scrollIntoViewIfNeeded();
  // The seats mark ends up on its share of the scale and stays there.
  await page.waitForTimeout(3500);
  const spot = await cards.first().evaluate((el) => {
    const track = el.querySelector(".vv-vs-track").getBoundingClientRect();
    const dot = el.querySelector(".vv-vs-pt.s").getBoundingClientRect();
    return ((dot.left + dot.width / 2 - track.left) / track.width) * 100;
  });
  expect(Math.abs(spot - 63.2)).toBeLessThan(1);
});

test("the top of Today is one calm card: the date, both Houses and what is next", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thisWeek/now");
  await expect(page.locator(".td-top")).toBeVisible();
  await expect(page.locator(".td-house")).toHaveCount(2);
  await expect(page.locator(".td-split, .td-jump")).toHaveCount(0);
});

test("the cross in the round Refer to this page close button is centred", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/polling");
  await page.getByRole("button", { name: "Refer to this page" }).click();
  const close = page.locator(".pf-x");
  await expect(close).toBeVisible();
  const off = await close.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const s = b.querySelector("svg").getBoundingClientRect();
    return [Math.abs(r.left + r.width / 2 - (s.left + s.width / 2)), Math.abs(r.top + r.height / 2 - (s.top + s.height / 2))];
  });
  expect(off[0]).toBeLessThan(0.6);
  expect(off[1]).toBeLessThan(0.6);
});

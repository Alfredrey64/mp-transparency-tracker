import { test, expect } from "@playwright/test";

// The banners that each have a picture of their own: the budget map on Spending by department, the campaign spending receipt on Election spending, and the case file and register
// wall on Foreign influence. Motion is switched off so each is read in its finished state.
test.use({ reducedMotion: "reduce" });

test("the departments banner is a map of the budget that opens on the later year and can be read block by block", async ({ page }) => {
  await page.goto("/departments");
  const banner = page.getByRole("region", { name: "At a glance" });
  await expect(banner.getByRole("button", { name: "2028-29", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(banner.locator(".hx-tile")).toHaveCount(16);
  await banner.getByRole("button", { name: /^Defence:/ }).click();
  await expect(banner.locator(".hx-read")).toContainText("£73.5bn");
  await banner.getByRole("button", { name: "2025-26", exact: true }).click();
  await expect(banner.locator(".hx-map-total")).toContainText("£648bn");
  await expect(banner.locator(".hx-map-total")).toContainText("2025-26");
});

test("the election spending banner is a receipt that adds up to the Commission's total and is stamped with its publication day", async ({ page }) => {
  await page.goto("/electionSpending");
  const banner = page.getByRole("region", { name: "At a glance" });
  await expect(banner).toContainText("Return of campaign spending");
  await expect(banner.locator(".hx-paper li")).toHaveCount(10);
  await expect(banner.locator(".hx-rc-total")).toContainText("£94.5m");
  await expect(banner.getByLabel("Published by the Electoral Commission on 17 July 2025")).toBeVisible();
});

test("the foreign influence banner walks the four steps and shows one sheet for each entry on the register", async ({ page }) => {
  await page.goto("/foreignInfluence");
  const banner = page.getByRole("region", { name: "At a glance" });
  await expect(banner.locator(".hx-rail li")).toHaveCount(4);
  await expect(banner.getByRole("img", { name: /21 entries on the public register, 2 of which do not display who registered/ })).toBeVisible();
  await expect(banner.locator(".hx-sheet")).toHaveCount(21);
  await expect(banner.locator(".hx-held")).toContainText("not counted");
});

test("the three banners fit a phone without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["/departments", "/electionSpending", "/foreignInfluence"]) {
    await page.goto(path);
    await expect(page.getByRole("region", { name: "At a glance" })).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});

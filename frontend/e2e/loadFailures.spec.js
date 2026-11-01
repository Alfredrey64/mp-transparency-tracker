import { test, expect } from "@playwright/test";

// When the database cannot be reached, a page says so. It must not read as "nothing found" (which would be untrue) or sit on "Loading" for ever.
test.beforeEach(async ({ page }) => {
  await page.route("**/rest/v1/**", (route) => route.abort("failed"));
});

test("by-elections says it could not load, rather than that there are none", async ({ page }) => {
  await page.goto("/byElections");
  await expect(page.getByText("Couldn't load the by-elections.")).toBeVisible();
  await expect(page.getByText("No by-elections recorded since the last general election yet.")).toHaveCount(0);
});

test("a donor search that cannot reach the registers says so, not that there are no donors", async ({ page }) => {
  await page.goto("/followTheMoney");
  await page.getByPlaceholder("A donor's name, such as Unite").fill("tesco");
  await expect(page.getByText("Couldn't load the donor registers.")).toBeVisible();
  await expect(page.getByText(/No donor called/)).toHaveCount(0);
});

test("a watchlist that cannot reach the database says so and does not mark the updates as seen", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mp-tracker-watchlist", JSON.stringify([{ id: 1, name: "Test Member", party: "Labour", party_colour: "#d50000", constituency: "Testford" }]));
  });
  await page.goto("/watchlist");
  await expect(page.getByText("Couldn't load your watchlist updates.")).toBeVisible();
  const lastChecked = await page.evaluate(() => Object.keys(localStorage).filter((k) => /check/i.test(k)).map((k) => localStorage.getItem(k)));
  expect(lastChecked).toEqual([]);
});

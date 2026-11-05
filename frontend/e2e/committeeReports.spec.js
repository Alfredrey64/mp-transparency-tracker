import { test, expect } from "@playwright/test";

// Committee reports and replies: each report is a card that opens to a plain-English account, and the page now sits as a tab beside How MPs voted.
test("a committee report opens to say what it is about, who wrote it and where the reply stands", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/committeeReports");
  const card = page.locator(".ib-card").first();
  await card.scrollIntoViewIfNeeded();
  const panel = card.locator(".ib-panel");
  await expect.poll(async () => (await panel.boundingBox()).height).toBe(0);

  await card.click({ position: { x: 300, y: 120 } });
  await expect(card.getByRole("button", { expanded: true })).toBeVisible();
  for (const name of ["What the report is about", "Has the government replied?"]) await expect(card.getByRole("heading", { name })).toBeVisible();
  await expect(card.getByText("nothing forces the government to agree")).toBeVisible();
  await expect(card.getByRole("link", { name: /Read the report/ })).toBeVisible();

  await card.getByRole("button", { expanded: true }).click();
  await expect.poll(async () => (await panel.boundingBox()).height).toBe(0);
});

test("the filters narrow the reports to the ones still waiting", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/committeeReports");
  await page.getByRole("button", { name: /^Not yet due/ }).click();
  const chips = await page.locator(".ib-card .ib-chip").allTextContents();
  expect(chips.length).toBeGreaterThan(0);
  for (const c of chips) expect(c).toMatch(/^Reply due/);
});

test("Laws made by ministers is a tab beside How MPs voted, and no longer under Watchdog committees", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  const votes = page.getByRole("navigation", { name: "How MPs vote" });
  await expect(votes.getByRole("link", { name: "How MPs voted" })).toBeVisible();
  await expect(votes.getByRole("link", { name: "MPs who defy their party" })).toBeVisible();
  await expect(votes.getByRole("link", { name: "Laws made by ministers" })).toHaveAttribute("aria-current", "page");
  await page.goto("/committeeReports");
  const watch = page.getByRole("navigation", { name: "Watchdog committees" });
  await expect(watch.getByRole("link", { name: "Reports and replies" })).toBeVisible();
  await expect(watch.getByRole("link", { name: "Laws made by ministers" })).toHaveCount(0);
});

import { test, expect } from "@playwright/test";

// The newest statutory instruments: each card opens to say what it does in plain words, and clicking anywhere on a closed card opens it.
test("an instrument card opens to show what it does and closes again", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  const card = page.locator(".ib-card").first();
  await card.scrollIntoViewIfNeeded();
  const toggle = card.getByRole("button", { expanded: false });
  await expect(toggle).toBeVisible();
  const panel = card.locator(".ib-panel");
  const height = async () => (await panel.boundingBox()).height;
  await expect.poll(height).toBe(0);

  await card.click({ position: { x: 300, y: 120 } });
  await expect(card.getByRole("button", { expanded: true })).toBeVisible();
  await expect(card.getByRole("heading", { name: "What it does" })).toBeVisible();
  await expect(card.getByRole("heading", { name: "How it goes through Parliament" })).toBeVisible();
  await expect(card.getByRole("link", { name: /Read the full text on legislation.gov.uk/ })).toBeVisible();

  await card.getByRole("button", { expanded: true }).click();
  await expect.poll(height).toBe(0);
});

test("the filter buttons narrow the list to what Parliament must approve", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/statutoryInstruments");
  await page.getByRole("button", { name: /^Parliament must approve/ }).click();
  const chips = await page.locator(".ib-card .ib-chip").allTextContents();
  expect(chips.length).toBeGreaterThan(0);
  for (const c of chips) expect(c).not.toMatch(/unless a House objects/);
});

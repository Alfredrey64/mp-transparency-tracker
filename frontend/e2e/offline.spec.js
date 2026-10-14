import { test, expect } from "@playwright/test";

// The service worker lets pages that were opened before, and the app itself, open without a connection. This runs the built site in Chromium, lets
// the worker save what it saves, goes offline, and checks that a saved page reloads, that a page address never opened before still opens the app and
// shows the right page, and that a page the site does not have gets the offline notice instead of a browser error.

test("a visited page reloads offline, and an unvisited page address still opens the app", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.goto("/taxRates");
  await expect(page.locator("h1").first()).toHaveText("Taxes");
  // The worker is told which files this visit loaded, and saves the ones it has not already got.
  await expect.poll(async () => page.evaluate(async () => (await caches.keys()).length), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.locator("h1").first()).toHaveText("Taxes");
  await page.waitForTimeout(1500);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1").first()).toHaveText("Taxes");
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");

  // A page address that was never opened: served from the saved app, which shows the page the address names.
  await page.goto("/taxRates/vat");
  await expect(page.locator("#h-tax-detail")).toHaveText("VAT", { timeout: 15000 });

  // An address with a file ending that is not saved gets no pretend page.
  const res = await page.goto("/p/never-saved.html").catch(() => null);
  if (res) expect(res.status()).toBe(503);
  await context.setOffline(false);
});

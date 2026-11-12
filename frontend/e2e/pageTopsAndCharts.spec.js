import { test, expect } from "@playwright/test";

// The tops of the paid lobbyists and ministers' meetings pages, the departments pie and its "growing and squeezed" chart, and the peerages page in the House of Lords menu group.

test("the lobbyists page opens with a sentence carrying its numbers, not a row of boxes", async ({ page }) => {
  await page.goto("/lobbyingRegister");
  await expect(page.getByRole("heading", { name: "The register of consultant lobbyists" })).toBeVisible();
  await expect(page.getByRole("region", { name: "At a glance" })).toHaveCount(0);
  const lead = page.getByRole("region", { name: "The register in brief" });
  await expect(lead).toContainText("Since 2014");
  await expect(lead).toContainText("are on it today");
  await expect(page.locator(".st-case-flag")).toHaveCount(3);
});

test("the ministers' meetings page leads with one figure and its facts", async ({ page }) => {
  await page.goto("/ministerialMeetings");
  const glance = page.getByRole("region", { name: "At a glance" });
  await expect(glance).toContainText("declared meetings");
  await expect(glance).toContainText("ministers in the sample");
  await expect(page.getByRole("region", { name: "How to read this page" })).toContainText("Remember it is a sample");
});

test("the departments page has a pie whose slices open, and a chart of who is growing and who is squeezed", async ({ page }) => {
  await page.goto("/departments");
  const pie = page.locator(".sp");
  await expect(pie.getByText("Share of planned departmental spending in 2028-29")).toBeVisible();
  const health = pie.getByRole("button", { name: /^Health/ });
  await expect(health).toHaveAttribute("aria-expanded", "false");
  await health.click();
  await expect(health).toHaveAttribute("aria-expanded", "true");
  await expect(pie.getByText(/2025-26, .* in 2028-29: up/)).toBeVisible();
  const chart = page.locator(".cb");
  await expect(chart.getByRole("heading", { name: "Growing" })).toBeVisible();
  await expect(chart.getByRole("heading", { name: "Squeezed" })).toBeVisible();
  await expect(chart.locator("li")).toHaveCount(6);
});

test("the peerages page sits in the House of Lords group", async ({ page }) => {
  await page.goto("/honours");
  await expect(page.getByRole("heading", { name: /Peerages and honours/ }).first()).toBeVisible();
  await page.goto("/lords");
  await expect(page.getByRole("link", { name: "Peerages" }).first()).toBeVisible();
});

import { test, expect } from "@playwright/test";

// The four pages added with the Your area update: each opens with its figures and sources, and the flooding page's postcode check answers from the two outside
// services, which the test answers itself.
const cors = { "access-control-allow-origin": "*" };
const pages = [
  ["welfare", "Welfare and benefits", "£241.30"],
  ["farming", "Farming and food", "212,000"],
  ["flooding", "Flooding and air quality", "6.3m"],
  ["digital", "Digital and online safety", "89%"],
  ["committeeReports", "Committee reports and government replies", "Typical wait for a reply"],
  ["howBudgetWorks", "How the Budget and the Spending Review work", "28 Oct"],
  ["getThingsDone", "How to get something done", "12 months"],
  ["inquiries", "Public inquiries", "£1.5bn+"],
  ["departments", "Spending by department", "£648bn"],
  ["statutoryInstruments", "Laws made by ministers", "Had to be approved"],
];

for (const [key, title, figure] of pages) {
  test(`${key} opens with its figures and its sources, with no sideways scroll on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/${key}`);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible({ timeout: 20000 });
    await expect(page.locator("main")).toContainText(figure);
    await expect(page.locator(".st-sources li").first()).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("the flooding page's postcode check shows live warnings for England and says so when there are none", async ({ page }) => {
  await page.route("**/api.postcodes.io/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result: { country: "England", region: "South West", admin_district: "Bristol, City of", latitude: 51.45, longitude: -2.58 } }) }));
  let warnings = [{ floodAreaID: "x", severityLevel: 2, description: "River Frome at Frenchay", floodArea: { county: "Bristol" } }];
  await page.route("**/environment.data.gov.uk/flood-monitoring/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ items: warnings }) }));
  await page.goto("/flooding");
  await page.locator("#fa-code").fill("BS1 5TR");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".st-warns")).toContainText("Flood warning");
  await expect(page.locator(".st-warns")).toContainText("River Frome at Frenchay");
  warnings = [];
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".st-check-ok")).toContainText("No flood warnings or alerts");
});

test("the flooding page's postcode check points outside England to the right flood service", async ({ page }) => {
  await page.route("**/api.postcodes.io/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result: { country: "Scotland", admin_district: "City of Edinburgh", latitude: 55.9, longitude: -3.2 } }) }));
  await page.goto("/flooding");
  await page.locator("#fa-code").fill("EH1 2NG");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".st-check-out")).toContainText("SEPA flood maps");
  await expect(page.locator(".st-warns")).toHaveCount(0);
});

test("the short version button hides the notes on an explainer page and the choice is kept on the next page", async ({ page }) => {
  await page.goto("/getThingsDone");
  await expect(page.getByRole("heading", { name: "How to get something done", level: 1 })).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".st-note").first()).toBeAttached();
  await page.getByRole("button", { name: "Short version" }).click();
  await expect(page.locator(".st-note")).toHaveCount(0);
  await page.goto("/inquiries");
  await expect(page.getByRole("button", { name: "Short version" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".st-note")).toHaveCount(0);
});

test("the Who handles it? game accepts the right answer and explains it", async ({ page }) => {
  await page.goto("/teacher/activities");
  await page.getByText("Who handles it?").first().click();
  await page.getByRole("button", { name: "The council service itself" }).click();
  await expect(page.locator(".gm-feedback")).toContainText("Start with the council service");
  await expect(page.getByRole("button", { name: "Next problem" })).toBeVisible();
});

test("the old Coming up address opens the Coming up part of What changed this week, and the three parts switch", async ({ page }) => {
  await page.goto("/upcoming");
  await expect(page.getByRole("heading", { name: "What changed this week", level: 1 })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("tab", { name: /Coming up/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("main")).toContainText("Bills with a stage due", { timeout: 20000 });
  await page.getByRole("tab", { name: /Today/ }).click();
  await expect(page.locator(".td-houses")).toBeVisible();
  await expect(page.locator(".td-house")).toHaveCount(2);
  await page.getByRole("tab", { name: /What changed/ }).click();
  await expect(page.getByRole("tab", { name: /What changed/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".td-houses")).toHaveCount(0);
  // The data service is refused in these tests, so the past part says it could not load rather than listing changes.
  await expect(page.locator(".tw-note")).toBeVisible({ timeout: 20000 });
});

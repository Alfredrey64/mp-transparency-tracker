import { test, expect } from "@playwright/test";

// The interactive parts of the issue pages: the sliders, pickers and date box do what they say, and the charts change with the buttons above them.

// A card is a section labelled by its heading, whose id the tests use.
const card = (page, id) => page.locator(`section:has(#${id})`);

test.beforeEach(async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
});

test("the trend chart changes with the button, and says what it shows", async ({ page }) => {
  await page.goto("/education");
  const chart = card(page, "h-edu-trends");
  await expect(chart).toContainText("2015/16");
  await chart.getByRole("button", { name: "Free school meals" }).click();
  await expect(chart.getByRole("button", { name: "Free school meals" })).toHaveAttribute("aria-pressed", "true");
  await expect(chart).toContainText("26.5% in 2025/26");
  await chart.getByRole("button", { name: "Absence" }).click();
  await expect(chart).toContainText("no figure for 2019/20");
});

test("the repayment slider changes what is repaid", async ({ page }) => {
  await page.goto("/education/university");
  const pay = page.locator("#edu-pay");
  await expect(page.locator("output[for=edu-pay]")).toHaveText("£40,000");
  await expect(page.getByText("£955 a year")).toBeVisible();
  await pay.fill("20000");
  await expect(page.locator("output[for=edu-pay]")).toHaveText("£20,000");
  await expect(page.getByText("Nothing").first()).toBeVisible();
  await pay.fill("60000");
  await expect(page.getByText("£3,150 a year")).toBeVisible();
});

test("the group comparison switches measure", async ({ page }) => {
  await page.goto("/education/gaps");
  const groups = card(page, "h-edug-groups");
  await expect(groups).toContainText("50.4");
  await groups.getByRole("button", { name: /English and maths/ }).click();
  await expect(groups).toContainText("53.1%");
});

test("the date of birth box gives the State Pension age", async ({ page }) => {
  await page.goto("/ageing/pension");
  await page.locator("#age-dob").fill("1960-07-31");
  await expect(card(page, "h-agep-age").getByRole("status")).toContainText("30 November 2026");
  await expect(card(page, "h-agep-age").getByRole("status")).toContainText("66 years and 4 months");
  await page.locator("#age-dob").fill("1990-02-01");
  await expect(card(page, "h-agep-age").getByRole("status")).toContainText("1 February 2058");
  await page.locator("#age-dob").fill("1977-05-20");
  await expect(card(page, "h-agep-age").getByRole("status")).toContainText("6 July 2044");
});

test("the population chart can show shares", async ({ page }) => {
  await page.goto("/ageing/people");
  const panel = card(page, "h-agepo-stages");
  await expect(panel).toContainText("67.6 million people");
  await panel.getByRole("button", { name: "Share of the population" }).click();
  await expect(panel).toContainText("Under 16 18.3%");
});

test("the cost tool follows the slider and the target buttons", async ({ page }) => {
  await page.goto("/defence");
  const cost = card(page, "h-def-cost");
  await cost.getByRole("button", { name: /2.5%: Promised by 2027/ }).click();
  await expect(cost.locator("output")).toHaveText("2.5%");
  await expect(cost.getByRole("button", { name: /2.5%: Promised/ })).toHaveAttribute("aria-pressed", "true");
  await cost.locator("#def-share").fill("3.5");
  await expect(cost.locator("output")).toHaveText("3.5%");
  await expect(cost).toContainText("£109bn");
});

test("countries can be added to and removed from the comparison, up to six", async ({ page }) => {
  await page.goto("/defence/spending");
  const panel = card(page, "h-defs-compare");
  await panel.getByRole("button", { name: "Poland" }).click();
  await expect(panel.getByRole("button", { name: "Poland" })).toHaveAttribute("aria-pressed", "true");
  await panel.getByRole("button", { name: "Spain" }).click();
  await panel.getByRole("button", { name: "Spain" }).click();
  await expect(panel.getByRole("button", { name: "Spain" })).toHaveAttribute("aria-pressed", "false");
  await panel.getByRole("button", { name: "France" }).click();
  await expect(panel.getByRole("button", { name: "France" })).toHaveAttribute("aria-pressed", "false");
  await panel.getByRole("button", { name: "Real-terms spending" }).click();
  await expect(panel).toContainText("billion");
});

test("the regional map changes with the measure and a region can be picked from the list", async ({ page }) => {
  await page.goto("/inequality/place");
  const map = card(page, "h-place-map");
  await expect(map).toContainText("London is highest (26.7%)");
  await map.getByRole("button", { name: "Children in poverty" }).click();
  await expect(map.getByRole("button", { name: "Children in poverty" })).toHaveAttribute("aria-pressed", "true");
  await map.getByRole("button", { name: "Typical wealth" }).click();
  await expect(map).toContainText("n/a");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /North East/ }).click();
  await expect(map.getByRole("heading", { name: "North East" })).toBeVisible();
  await expect(map).toContainText("highest of");
  await map.getByRole("button", { name: "Clear" }).click();
  await expect(map).toContainText("Tap a place on the map");
});

test("the over-time chart follows the chosen region", async ({ page }) => {
  await page.goto("/inequality/place");
  const time = card(page, "h-place-time");
  await time.locator("#ineq-place-region").selectOption("london");
  await expect(time).toContainText("London: ");
  await time.getByRole("button", { name: "Children" }).click();
  await expect(time).toContainText("London: ");
  await time.getByRole("button", { name: /Income per head against the UK/ }).click();
  await expect(time).toContainText("London: 1");
});

test("the seat map loads, can be narrowed to a region, and lists the most deprived seats", async ({ page }) => {
  await page.goto("/inequality/place");
  const seats = card(page, "h-place-seats");
  await expect(seats.getByRole("img")).toHaveAttribute("aria-label", /543 Westminster seats/);
  await expect(seats).toContainText("Birmingham Ladywood");
  await seats.locator("#ineq-hex-region").selectOption("london");
  await expect(seats).toContainText("Most income-deprived seats in London");
  await expect(seats).not.toContainText("Birmingham Ladywood");
});

test("the local areas can be ranked within a region", async ({ page }) => {
  await page.goto("/inequality/place");
  const within = card(page, "h-place-within");
  await expect(within).toContainText("Westminster and City of London");
  await within.locator("#ineq-local-region").selectOption("wales");
  await within.getByRole("button", { name: "Lowest" }).click();
  await expect(within.getByRole("list", { name: /lowest income per head/ })).toContainText("Wales");
});

test("the other-countries tab ranks the UK, and the choices change what is shown", async ({ page }) => {
  await page.goto("/inequality/abroad");
  const rank = card(page, "h-abroad-rank");
  await expect(rank).toContainText("United Kingdom");
  await expect(rank).toContainText("6th most unequal");
  await rank.getByRole("button", { name: "Poverty rate" }).click();
  await expect(rank).toContainText("most unequal");
  await rank.getByRole("button", { name: /Also Brazil/ }).click();
  await expect(rank).toContainText("Brazil");
  const redist = card(page, "h-abroad-redist");
  await expect(redist).not.toContainText("Slovakia");
  await redist.getByRole("button", { name: /All \d+ OECD members/ }).click();
  await expect(redist).toContainText("Slovakia");
});

test("countries can be added to and removed from the Gini over time", async ({ page }) => {
  await page.goto("/inequality/abroad");
  const time = card(page, "h-abroad-time");
  await time.getByRole("button", { name: "Spain" }).click();
  await expect(time.getByRole("button", { name: "Spain" })).toHaveAttribute("aria-pressed", "true");
  await expect(time).toContainText("Spain 31.2 in 2023");
  await time.getByRole("button", { name: "Germany" }).click();
  await expect(time.getByRole("button", { name: "Germany" })).toHaveAttribute("aria-pressed", "false");
});

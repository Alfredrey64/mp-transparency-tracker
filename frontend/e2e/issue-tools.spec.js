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

test("the Brexit overview chart switches between income, exports, the EU share and migration", async ({ page }) => {
  await page.goto("/brexit");
  const trends = card(page, "h-bx-trends");
  await expect(trends).toContainText(/United Kingdom: [\d.]+ in 2014 Q1/);
  await trends.getByRole("button", { name: "Goods exports", exact: true }).click();
  await expect(trends).toContainText("To the EU: ");
  await trends.getByRole("button", { name: "EU share of goods exports" }).click();
  await expect(trends).toContainText("55.7% in 2010 Q1");
  await trends.getByRole("button", { name: "Net migration" }).click();
  await expect(trends).toContainText("12 months to");
});

test("economies can be added to the Brexit income comparison, and the UK stays on", async ({ page }) => {
  await page.goto("/brexit/economy");
  const compare = card(page, "h-bxe-compare");
  await expect(compare.getByRole("button", { name: "United Kingdom" })).toBeDisabled();
  await compare.getByRole("button", { name: "Germany" }).click();
  await expect(compare.getByRole("button", { name: "Germany" })).toHaveAttribute("aria-pressed", "true");
  await expect(compare).toContainText("Germany +");
  await compare.getByRole("button", { name: "G7 countries" }).click();
  await expect(compare.getByRole("button", { name: "G7 countries" })).toHaveAttribute("aria-pressed", "false");
});

test("the Brexit trade tab shows each nation's goods trade", async ({ page }) => {
  await page.goto("/brexit/trade");
  const nation = card(page, "h-bxt-nation");
  await expect(nation).toContainText("England's goods exports to the EU");
  await nation.getByRole("button", { name: "Scotland" }).click();
  await expect(nation).toContainText("oil and gas products");
  await nation.getByRole("button", { name: "Northern Ireland" }).click();
  await expect(nation).toContainText("Windsor Framework");
  await nation.getByRole("button", { name: "Imports" }).click();
  await expect(nation).toContainText("From the EU: ");
});

test("the Brexit map shows the vote and migration, and a region on all three measures", async ({ page }) => {
  await page.goto("/brexit/society");
  const map = card(page, "h-bxs-vote");
  await expect(map).toContainText("West Midlands is highest (59.3%) and Scotland lowest (38.0%)");
  await map.getByRole("button", { name: "Net migration" }).click();
  await expect(map).toContainText("London is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /Wales/ }).click();
  await expect(map.getByRole("heading", { name: "Wales" })).toBeVisible();
  await expect(map).toContainText("Voted Leave in 2016");
});

test("the NHS map changes with the measure and shows a region on every measure", async ({ page }) => {
  await page.goto("/nhs/waiting");
  const map = card(page, "h-hw-map");
  await expect(map).toContainText("North East is highest");
  await map.getByRole("button", { name: "Waiting list per 1,000 people" }).click();
  await expect(map).toContainText("is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /London/ }).click();
  await expect(map.getByRole("heading", { name: "London" })).toBeVisible();
  await expect(map).toContainText("Seen within 18 weeks");
});

test("the NHS charts switch measure and show the standard", async ({ page }) => {
  await page.goto("/nhs");
  const trends = card(page, "h-hl-trends");
  await trends.getByRole("button", { name: "Within 18 weeks" }).click();
  await expect(trends).toContainText("Standard 92%");
  await trends.getByRole("button", { name: "A&E four-hour wait" }).click();
  await expect(trends).toContainText("All A&E: 97.2% in November 2010");
  await page.goto("/nhs/emergency");
  const cancer = card(page, "h-he-cancer");
  await cancer.getByRole("button", { name: "Diagnosis within 28 days" }).click();
  await expect(cancer).toContainText("28 days");
});

test("the NHS comparison changes measure and keeps the UK highlighted", async ({ page }) => {
  await page.goto("/nhs/money");
  const compare = card(page, "h-hm-compare");
  await expect(compare).toContainText("United Kingdom");
  await compare.getByRole("button", { name: "Hospital beds per 1,000" }).click();
  await expect(compare.getByRole("button", { name: "Hospital beds per 1,000" })).toHaveAttribute("aria-pressed", "true");
  await expect(compare).toContainText("South Korea");
});

test("the energy regional map changes with the measure and shows a region on every measure", async ({ page }) => {
  await page.goto("/energy/emissions");
  const map = card(page, "h-ne-map");
  await expect(map).toContainText("Northern Ireland is highest");
  await map.getByRole("button", { name: "Transport" }).click();
  await expect(map).toContainText("is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /London/ }).click();
  await expect(map.getByRole("heading", { name: "London" })).toBeVisible();
  await expect(map).toContainText("Fall in emissions per person");
});

test("the energy charts switch view and the bill tool changes with the area and use", async ({ page }) => {
  await page.goto("/energy");
  const trends = card(page, "h-no-trends");
  await trends.getByRole("button", { name: "Fossil fuels in electricity" }).click();
  await expect(trends).toContainText("Gas, coal and oil");
  await page.goto("/energy/bills");
  const cap = card(page, "h-nb-cap");
  await cap.getByRole("button", { name: "Networks and schemes" }).click();
  await expect(cap).toContainText("Government schemes");
  const area = card(page, "h-nb-area");
  const before = await area.locator("[aria-live=polite]").innerText();
  await area.getByRole("combobox").selectOption("North Scotland");
  await area.getByLabel("Electricity used in a year").fill("6000");
  const after = await area.locator("[aria-live=polite]").innerText();
  expect(after).not.toEqual(before);
  await expect(area.locator("[aria-live=polite]")).toContainText("North Scotland");
  await area.getByRole("button", { name: "Gas", exact: true }).click();
  await expect(area).toContainText("The gas bill ranges from");
});

test("the trust comparison changes institution and keeps the UK highlighted, and the voting chart switches", async ({ page }) => {
  await page.goto("/trust/trust");
  const compare = card(page, "h-tt-compare");
  await expect(compare).toContainText("United Kingdom");
  await compare.getByRole("button", { name: "Courts and legal system" }).click();
  await expect(compare.getByRole("button", { name: "Courts and legal system" })).toHaveAttribute("aria-pressed", "true");
  await expect(compare).toContainText("OECD average");
  await page.goto("/trust/voting");
  const turnout = card(page, "h-tv-turnout");
  await turnout.getByRole("button", { name: "Labour and Conservative vote share" }).click();
  await expect(turnout).toContainText("two largest parties together");
});

test("the care map changes with the measure and shows a region on every measure", async ({ page }) => {
  await page.goto("/care/adult");
  const map = card(page, "h-ca-map");
  await expect(map).toContainText("North West is highest");
  await map.getByRole("button", { name: "A week in a nursing home" }).click();
  await expect(map).toContainText("is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /London/ }).click();
  await expect(map.getByRole("heading", { name: "London" })).toBeVisible();
  await expect(map).toContainText("Spending per adult");
  await expect(map).toContainText("England");
});

test("the care charts switch view, and the childcare map and chart work", async ({ page }) => {
  await page.goto("/care/workers");
  const trend = card(page, "h-cw-trend");
  await trend.getByRole("button", { name: "Pay against the minimum wage" }).click();
  await expect(trend).toContainText("National Minimum or Living Wage");
  await page.goto("/care/childcare");
  const map = card(page, "h-cc-map");
  await map.getByRole("button", { name: /Two year olds taking the hours/ }).click();
  await expect(map).toContainText("is highest");
  const funded = card(page, "h-cc-main");
  await funded.getByRole("button", { name: "Take-up" }).click();
  await expect(funded).toContainText("registered");
});

test("the transport map changes with the measure, and the rail and bus charts switch view", async ({ page }) => {
  await page.goto("/transport/place");
  const map = card(page, "h-tp-map");
  await expect(map).toContainText("South East is highest");
  await map.getByRole("button", { name: "Bus journeys per person" }).click();
  await expect(map).toContainText("London is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /Wales/ }).click();
  await expect(map.getByRole("heading", { name: "Wales" })).toBeVisible();
  await expect(map).toContainText("Cars per 1,000 people");
  await page.goto("/transport/rail");
  const rail = card(page, "h-tt-rail");
  await rail.getByRole("button", { name: "Fares against prices" }).click();
  await expect(rail).toContainText("Retail Prices Index");
  await page.goto("/transport/buses");
  const bus = card(page, "h-tb-main");
  await bus.getByRole("button", { name: "Fares" }).click();
  await expect(bus).toContainText("March 2005 as 100");
});

test("the devolution map changes with the measure and the spending chart picks a place", async ({ page }) => {
  await page.goto("/union/place");
  const map = card(page, "h-dp-map");
  await expect(map).toContainText("Northern Ireland is highest");
  await map.getByRole("button", { name: "Economic output per person" }).click();
  await expect(map).toContainText("London is highest");
  await map.getByRole("list", { name: /by region, highest first/ }).getByRole("button", { name: /Wales/ }).click();
  await expect(map.getByRole("heading", { name: "Wales" })).toBeVisible();
  await expect(map).toContainText("Spending on services per person");
  await page.goto("/union/money");
  const func = card(page, "h-dm-func");
  await func.getByRole("button", { name: "Wales" }).click();
  await expect(func.getByRole("button", { name: "Wales" })).toHaveAttribute("aria-pressed", "true");
  await expect(func).toContainText("Wales: £");
});

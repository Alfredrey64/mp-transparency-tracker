import { test, expect } from "@playwright/test";

// The top of My area: the MP's strip sits straight under the banner, and each entry in "Your week" opens to say in plain English what it is.
const result = {
  postcode: "BS1 5TR", latitude: 51.4545, longitude: -2.5879, country: "England", region: "South West", parliamentary_constituency: "Bristol Central", admin_district: "Bristol, City of", admin_ward: "Hotwells and Harbourside",
  admin_county: null, parish: "x", index_of_multiple_deprivation: 18522, pfa: "x", icb: "x", lsoa: "x", msoa: "x", ruc21: "x", national_park: "x", ttwa: "Bristol",
  codes: { admin_district: "E06000023", admin_county: "E99999999", admin_ward: "E05010905" },
};
const mp = [{ id: 1, name: "Test Member", party: "Labour", party_colour: "d50000", thumbnail_url: null, cabinet_role: null, parliament_member_id: 4321 }];
const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const votes = [{ title: "Renters' Rights Bill - Third Reading", date: day(1), voted_aye: true, voted_with_party_majority: false, source_url: "https://example.org/division/1" }];
const interests = [{ donor_name: "Acme Ltd", value_amount: 500, date_registered: day(3), category: "Donations and other support (b)", summary: "Acme Ltd - £500", source_url: null }];
const bills = [{ bill_id: 7, short_title: "Renters' Rights Bill", long_title: "A Bill to make provision about tenancies; to abolish fixed terms; and for connected purposes.", current_stage: "Report stage", current_house: "Commons", last_updated: day(1), is_act: false, is_defeated: false, source_url: "https://bills.parliament.uk/bills/1" }];
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };

async function mock(page) {
  await page.addInitScript(() => localStorage.setItem("mp-transparency-my-postcode", "BS1 5TR"));
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (req.method() === "HEAD") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "0-0/42" }, body: "" });
    const body = url.includes("/politicians") ? mp : url.includes("/voting_records") ? votes : url.includes("/financial_interests") ? interests : url.includes("/bills") ? bills : [];
    return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(body) });
  });
  await page.route("**/api.postcodes.io/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result }) }));
  await page.route("**/www.planning.data.gov.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ entities: [] }) }));
  await page.route("**/elections.democracyclub.org.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ results: [] }) }));
}

test("the MP's photo and name come straight after the banner", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mock(page);
  await page.goto("/myArea");
  const strip = page.locator(".ma-mpstrip");
  await expect(strip).toBeVisible({ timeout: 20000 });
  await expect(strip.getByText("Test Member")).toBeVisible();
  const order = await page.evaluate(() => {
    const hero = document.querySelector(".ma-hero");
    const next = hero.nextElementSibling;
    return next?.classList.contains("ma-mpstrip");
  });
  expect(order).toBe(true);
  await expect(page.locator("#ma-mp .ma-mpcard")).toHaveCount(0);
  if (process.env.WEEK_SHOT) { await strip.scrollIntoViewIfNeeded(); await page.waitForTimeout(2500); await strip.screenshot({ path: process.env.WEEK_SHOT.replace(".png", "-top.png") }); }
});

test("each vote, register entry and bill in Your week opens to a plain explanation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mock(page);
  await page.goto("/myArea");
  const vote = page.locator("#ma-week .ma-wk-mp .ma-wk-item").first();
  await expect(vote).toBeVisible({ timeout: 20000 });
  const button = vote.getByRole("button");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(vote.getByText("What this vote was.")).toBeVisible();
  await expect(vote.getByText("They voted against the way most of their own party voted.")).toBeVisible();
  await expect(vote.getByRole("link", { name: /official record of this vote/ })).toHaveAttribute("href", "https://example.org/division/1");

  const interest = page.locator("#ma-week .ma-wk-mp .ma-wk-item", { hasText: "Acme Ltd" });
  await interest.getByRole("button").click();
  await expect(interest.getByText("Register of Members' Financial Interests")).toBeVisible();
  await expect(interest.getByRole("link", { name: /full register/ })).toHaveAttribute("href", /members\.parliament\.uk\/member\/4321/);

  const bill = page.locator("#ma-week .ma-wk-bills .ma-wk-item").first();
  await bill.getByRole("button").click();
  await expect(bill.getByText("Where it stands.")).toBeVisible();
  await expect(bill.getByRole("link", { name: /Parliament's site/ })).toBeVisible();
  await page.waitForTimeout(900);
  await page.locator("#ma-week").scrollIntoViewIfNeeded();
  await page.screenshot({ path: process.env.WEEK_SHOT ?? "/private/tmp/claude-501/-Users-alfredreynolds-mp-transparency-tracker/aee2670b-c426-461f-a42c-4a5aeb7079e8/scratchpad/week.png", fullPage: false });
});

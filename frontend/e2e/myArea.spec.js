import { test, expect } from "@playwright/test";

// Your area, for a postcode in Bristol, with the three outside services answered by the test: the postcode lookup, the MP record and the elections list.
const result = {
  postcode: "BS1 5TR", country: "England", region: "South West", parliamentary_constituency: "Bristol Central", admin_district: "Bristol, City of", admin_ward: "Hotwells and Harbourside",
  admin_county: null, parish: "Bristol, City of, unparished area", index_of_multiple_deprivation: 18522, pfa: "Avon and Somerset", icb: "NHS Bristol, North Somerset and South Gloucestershire Integrated Care Board",
  lsoa: "Bristol 061C", msoa: "Bristol 061", ruc21: "Urban: Nearer to a major town or city", national_park: "England (non-National Park)", ttwa: "Bristol",
  codes: { admin_district: "E06000023", admin_county: "E99999999", admin_ward: "E05010905" },
};
const mp = [{ id: 1, name: "Test Member", party: "Labour", party_colour: "d50000", thumbnail_url: null, cabinet_role: null }];
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };

async function mockServices(page, { elections = { results: [] } } = {}) {
  await page.addInitScript(() => localStorage.setItem("mp-transparency-my-postcode", "BS1 5TR"));
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (req.method() === "HEAD") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "0-0/42" }, body: "" });
    return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(req.url().includes("/politicians") ? mp : []) });
  });
  await page.route("**/api.postcodes.io/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result }) }));
  await page.route("**/elections.democracyclub.org.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(elections) }));
}

for (const width of [1440, 390]) {
  test(`Your area fills in every section from one postcode, with no sideways scroll, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockServices(page);
    await page.goto("/myArea");
    await expect(page.locator(".ma-section")).toHaveCount(6, { timeout: 20000 });
    await expect(page.locator(".ma-g:not(.ma-g-skel)")).toHaveCount(6, { timeout: 20000 });
    await expect(page.locator(".ma-skel")).toHaveCount(0, { timeout: 20000 });
    const text = await page.locator("main").innerText();
    await expect(page.locator(".ma-map polygon")).toHaveCount(652);
    await expect(page.locator(".ma-hist-stack")).not.toHaveCount(0);
    await expect(page.locator(".ma-track-dot").first()).toBeAttached();
    for (const want of ["How Bristol Central voted in 2024", "Where Bristol Central sits among the 650", "How your council has changed", "Elections coming up where you live", "Your council tax", "Who does what here", "Your neighbourhood", "Where South West ranks", "Who lives in South West", "Useful links for where you live", "Before polling day"]) expect(text).toContain(want);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("the jump links move to their section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  await expect(page.locator(".ma-section")).toHaveCount(6, { timeout: 20000 });
  await expect(page.locator(".ma-skel")).toHaveCount(0, { timeout: 20000 });
  await page.getByRole("button", { name: "Council", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("ma-council").getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThan(200);
});

test("elections the lookup lists are shown with their dates and the photo ID note", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page, { elections: { results: [{ election_id: "local.bristol.2099-05-06", poll_open_date: "2099-05-06", election_title: "Bristol local election", elected_role: "Local Councillor", requires_voter_id: "EA-2022", voting_system: { slug: "FPTP", name: "First past the post" }, seats_contested: 1, election_type: { election_type: "local" }, timetable: {} }] } });
  await page.goto("/myArea");
  await expect(page.locator(".ma-contest-list li")).toHaveCount(1, { timeout: 20000 });
  await expect(page.locator(".ma-contest-list")).toContainText("Photo ID needed");
});

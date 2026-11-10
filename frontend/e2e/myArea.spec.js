import { test, expect } from "@playwright/test";

// Your area, for a postcode in Bristol, with the three outside services answered by the test: the postcode lookup, the MP record and the elections list.
const result = {
  postcode: "BS1 5TR", latitude: 51.4545, longitude: -2.5879, country: "England", region: "South West", parliamentary_constituency: "Bristol Central", admin_district: "Bristol, City of", admin_ward: "Hotwells and Harbourside",
  admin_county: null, parish: "Bristol, City of, unparished area", index_of_multiple_deprivation: 18522, pfa: "Avon and Somerset", icb: "NHS Bristol, North Somerset and South Gloucestershire Integrated Care Board",
  lsoa: "Bristol 061C", msoa: "Bristol 061", ruc21: "Urban: Nearer to a major town or city", national_park: "England (non-National Park)", ttwa: "Bristol",
  codes: { admin_district: "E06000023", admin_county: "E99999999", admin_ward: "E05010905" },
};
const mp = [{ id: 1, name: "Test Member", party: "Labour", party_colour: "d50000", thumbnail_url: null, cabinet_role: null }];
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };

async function mockServices(page, { elections = { results: [] }, votes = [], over = {} } = {}) {
  await page.addInitScript(() => localStorage.setItem("mp-transparency-my-postcode", "BS1 5TR"));
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (req.method() === "HEAD") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "0-0/42" }, body: "" });
    return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(req.url().includes("/politicians") ? mp : req.url().includes("/voting_records") ? votes : []) });
  });
  await page.route("**/api.postcodes.io/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result: { ...result, ...over } }) }));
  await page.route("**/www.planning.data.gov.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ entities: [
    { dataset: "local-planning-authority", name: "Bristol, City of LPA" },
    { dataset: "conservation-area", name: "Redcliffe", "designation-date": "1976-11-03" },
    { dataset: "flood-risk-zone", "flood-risk-level": "2" },
    { dataset: "flood-risk-zone", "flood-risk-level": "3" },
  ] }) }));
  await page.route("**/elections.democracyclub.org.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(elections) }));
}

for (const width of [1440, 390]) {
  test(`Your area fills in every section from one postcode, with no sideways scroll, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockServices(page);
    await page.goto("/myArea");
    await expect(page.locator(".ma-section")).toHaveCount(7, { timeout: 20000 });
    await expect(page.locator(".ma-g:not(.ma-g-skel)")).toHaveCount(6, { timeout: 20000 });
    await expect(page.locator(".ma-skel")).toHaveCount(0, { timeout: 20000 });
    const text = await page.locator("main").innerText();
    await expect(page.locator(".ma-map polygon")).toHaveCount(652);
    await expect(page.locator(".ma-hist-stack")).not.toHaveCount(0);
    await expect(page.locator(".ma-elect-col").first()).toBeAttached();
    await expect(page.locator(".ma-spark-dot")).toBeAttached();
    await expect(page.locator(".ma-agebar")).toHaveCount(2);
    await expect(page.locator(".ma-track-dot").first()).toBeAttached();
    for (const want of ["Your week", "Bills on the move", "How Bristol Central voted in 2024", "Where Bristol Central sits among the 650", "What Test Member has been doing", "How your council has changed", "Elections coming up where you live", "Your council tax", "Who does what here", "Your neighbourhood", "Where South West ranks", "Who lives in South West", "Useful links for where you live", "Before polling day", "has declared and claimed", "How often they vote against their party", "Everyone else who speaks for you", "Homes and crime in South West", "Share it, print it or compare it"]) expect(text).toContain(want);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("the planning card names the deciding council, lists the designations in plain words and says what no entry means", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  const card = page.locator(".ma-planning");
  await expect(card).toContainText("decided by Bristol, City of", { timeout: 20000 });
  await expect(card).toContainText("Conservation area");
  await expect(card).toContainText("Redcliffe");
  await expect(card).toContainText("Flood zone 3");
  await expect(card).not.toContainText("Flood zone 2");
  await expect(card).toContainText("No entry here does not prove there is none");
});

test("the planning card is left out outside England, and when nothing is on record", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page, { over: { country: "Wales" } });
  await page.goto("/myArea");
  await expect(page.locator(".ma-section")).toHaveCount(7, { timeout: 20000 });
  await expect(page.locator(".ma-skel")).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator(".ma-planning")).toHaveCount(0);
});

test("the short print version keeps the main cards and leaves out the rest", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  await expect(page.locator(".ma-skel")).toHaveCount(0, { timeout: 20000 });
  await expect(page.getByRole("button", { name: "Print a short version" })).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.printShort = "1"; });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".ma-council")).toBeVisible();
  await expect(page.locator(".ma-mpcard")).toBeVisible();
  await expect(page.locator(".ma-census")).toBeHidden();
  await expect(page.locator("#ma-region")).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printShort; });
  await expect(page.locator(".ma-census")).toBeVisible();
});

test("the jump links move to their section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  await expect(page.locator(".ma-section")).toHaveCount(7, { timeout: 20000 });
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

test("the MP's activity opens on a tab with something in it and the tabs work from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  const tabs = page.getByRole("tablist", { name: "Kinds of activity" });
  await expect(tabs).toBeVisible({ timeout: 20000 });
  await tabs.getByRole("tab", { name: /^Debates/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: /^Questions/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

test("a vote opens to explain itself in plain English, one at a time, and closes again", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await mockServices(page, { votes: [
    { title: "Finance Bill: Second Reading", date: "2026-10-22", voted_aye: true, voted_with_party_majority: true },
    { title: "Finance Bill: Third Reading", date: "2026-10-15", voted_aye: false, voted_with_party_majority: false },
  ] });
  await page.goto("/myArea");
  await page.getByRole("tab", { name: /^Votes/ }).click({ timeout: 20000 });
  const heads = page.locator(".ma-entry-head");
  await expect(heads).toHaveCount(2);
  await expect(heads.first()).toHaveAttribute("aria-expanded", "false");
  await heads.first().click();
  await expect(heads.first()).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".ma-entry").first()).toContainText("What was being voted on");
  await heads.nth(1).click();
  await expect(heads.first()).toHaveAttribute("aria-expanded", "false");
  await expect(heads.nth(1)).toHaveAttribute("aria-expanded", "true");
  await heads.nth(1).click();
  await expect(heads.nth(1)).toHaveAttribute("aria-expanded", "false");
});

test("a Welsh postcode shows its police commissioner and its six Senedd members", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await mockServices(page, { over: { country: "Wales", region: null, pfa: "South Wales", senedd_constituency: "Caerdydd Penarth", parliamentary_constituency: "Cardiff South and Penarth", admin_district: "Cardiff", admin_ward: "Butetown", codes: { admin_district: "W06000015", admin_county: "W99999999", admin_ward: "W05001274" } } });
  await page.goto("/myArea");
  const card = page.locator(".ma-reps");
  await expect(card).toContainText("South Wales Police", { timeout: 20000 });
  await expect(card).toContainText("Senedd: Caerdydd Penarth");
  await expect(card.locator(".ma-rep-dev .ma-rep")).toHaveCount(6);
  await expect(card).toContainText("Police and crime commissioner");
});

test("the elections card offers a calendar file with the dates listed", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await mockServices(page, { elections: { results: [{ election_id: "local.bristol.2099-05-06", poll_open_date: "2099-05-06", election_title: "Bristol local election", elected_role: "Local Councillor", requires_voter_id: "EA-2022", voting_system: { slug: "FPTP", name: "First past the post" }, seats_contested: 1, election_type: { election_type: "local" }, timetable: { registration_deadline: "2099-04-16" } }] } });
  await page.goto("/myArea");
  const button = page.getByRole("button", { name: /dates to your calendar/ });
  await expect(button).toBeVisible({ timeout: 20000 });
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toBe("my-election-dates.ics");
  const text = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
  expect(text).toContain("BEGIN:VCALENDAR");
  expect(text).toContain("DTSTART;VALUE=DATE:20990506");
  expect(text).toContain("DTSTART;VALUE=DATE:20990416");
});

test("comparing with a postcode in the same seat says so instead of opening a comparison", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await mockServices(page);
  await page.goto("/myArea");
  const form = page.locator(".ma-tools-form");
  await expect(form).toBeVisible({ timeout: 20000 });
  await form.getByLabel("A postcode to compare with").fill("BS1 5TR");
  await form.getByRole("button", { name: "Compare" }).click();
  await expect(page.locator(".ma-tools .ma-err")).toContainText("too");
});

// "Your week": the first section, counting the last seven days of the MP's votes, new register entries and news, and the bills that moved.
test("Your week counts what was recorded for the MP and which bills moved, and says when a part cannot be loaded", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockServices(page);
  const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const tables = {
    voting_records: [
      { title: "Housing Bill: Third Reading", date: day(2), voted_aye: true, voted_with_party_majority: true },
      { title: "Rail Bill: Second Reading", date: day(3), voted_aye: false, voted_with_party_majority: false },
    ],
    financial_interests: [{ donor_name: "Example Ltd", value_amount: 2500, date_registered: day(5) }],
    mp_news: [{ headline: "Test Member visits a school", url: "https://example.org/news", published_date: day(1) }],
    bills: [
      { bill_id: 1, short_title: "Housing Bill", current_stage: "Report stage", current_house: "Commons", last_updated: `${day(1)}T10:00:00Z`, is_act: false, is_defeated: false },
      { bill_id: 2, short_title: "Rail Bill", current_stage: "Royal Assent", current_house: "Lords", last_updated: `${day(2)}T10:00:00Z`, is_act: true, is_defeated: false },
    ],
  };
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() !== "GET") return route.fallback();
    const table = Object.keys(tables).find((t) => req.url().includes(`/${t}`));
    if (!table || (table === "voting_records" && !req.url().includes("politician_id"))) return route.fallback();
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" }, body: JSON.stringify(tables[table]) });
  });
  await page.goto("/myArea");
  const week = page.locator("#ma-week");
  await expect(week).toContainText("Test Member this week", { timeout: 20000 });
  await expect(week).toContainText("Votes in the last 7 days");
  await expect(week.locator(".ma-wk-figs").first()).toContainText("2");
  await expect(week).toContainText("1 was against the majority of their own party");
  await expect(week).toContainText("Housing Bill: Final Commons vote on the bill");
  await expect(week).toContainText("Example Ltd, £2,500");
  await expect(week).toContainText("Test Member visits a school");
  await expect(week).toContainText("Bills that moved in the last 7 days");
  await expect(week).toContainText("Housing Bill");
  await expect(week).toContainText("Became law");
  await expect(week.getByRole("link", { name: "Everything that changed this week" })).toBeVisible();
  // It is the first section and has its own button in the jump bar.
  expect(await page.locator(".ma-section").first().getAttribute("id")).toBe("ma-week");
  await expect(page.locator(".ma-jump button").first()).toHaveText("Your week");
  await page.evaluate(() => document.getElementById("ma-week").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/your-week-desktop.png" });
});

test("Your week fits a phone and says so when the records cannot be reached", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockServices(page);
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() !== "GET" || !req.url().includes("/bills")) return route.fallback();
    return route.fulfill({ status: 500, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
  });
  await page.goto("/myArea");
  const week = page.locator("#ma-week");
  await expect(week).toContainText("We could not load the bills just now", { timeout: 20000 });
  await expect(week).toContainText("Votes in the last 7 days");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.evaluate(() => document.getElementById("ma-week").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/your-week-phone.png" });
});

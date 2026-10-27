import { test, expect } from "@playwright/test";

// Who is on my ballot. The network is mocked, so these never depend on the live Democracy Club service.
const ELECTION = {
  election_id: "local.manchester.harpurhey.by.2099-11-26", election_title: "Manchester local election Harpurhey by-election", poll_open_date: "2099-11-26",
  timetable: { close_of_nominations: "2099-10-30", registration_deadline: "2099-11-10", postal_vote_application_deadline: "2099-11-11", proxy_vote_application_deadline: "2000-01-01" },
  election_type: { election_type: "local" }, organisation: { common_name: "Manchester" }, division: { name: "Harpurhey" }, group_type: null,
  elected_role: "Local Councillor", seats_contested: 1, voting_system: { slug: "FPTP", name: "First-past-the-post" }, requires_voter_id: "EA-2022", cancelled: false, by_election_reason: "DEATH", deleted: false,
};
const GROUP = { election_id: "local.manchester.2099-11-26", poll_open_date: "2099-11-26", group_type: "organisation", election_title: "Manchester local election" };
const PEOPLE = {
  candidates_locked: false,
  candidacies: [
    { person: { id: 11, name: "Sarah Elizabeth Zimmer" }, party_name: "Party Zed" },
    { person: { id: 12, name: "Gerald David Adams" }, party_name: "Party Aye" },
    { person: { id: 13, name: "Duncan Douglas Moss" }, party_name: "Independent" },
  ],
};
const json = (body, status = 200) => ({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });

async function mock(page, { elections = { results: [GROUP, ELECTION], next: null }, ballot = PEOPLE, ballotStatus = 200, electionsStatus = 200 } = {}) {
  const calls = { elections: [], ballots: [] };
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.route("**/elections.democracyclub.org.uk/**", (route) => { calls.elections.push(route.request().url()); return route.fulfill(json(electionsStatus === 200 ? elections : { detail: "x" }, electionsStatus)); });
  await page.route("**/candidates.democracyclub.org.uk/**", (route) => { calls.ballots.push(route.request().url()); return route.fulfill(json(ballotStatus === 200 ? ballot : { detail: "x" }, ballotStatus)); });
  await page.route("**/api.postcodes.io/**", (route) => route.fulfill(json({ status: 200, result: { codes: { admin_district: "E09000033" } } })));
  return calls;
}
const search = async (page, pc) => { await page.getByLabel("Your postcode").fill(pc); await page.getByRole("button", { name: "Find" }).click(); };

test("shows the contest and its candidates by surname, with how to vote and the key dates", async ({ page }) => {
  const calls = await mock(page);
  await page.goto("/myBallot");
  await search(page, "m9 4fp");
  await expect(page.getByRole("heading", { name: /1 contest coming up for M9 4FP/ })).toBeFocused();
  const card = page.locator(".mb-card");
  await expect(card.getByRole("heading", { name: "Harpurhey, Manchester" })).toBeVisible();
  await expect(card).toContainText("held after the previous holder died");

  const names = await card.locator(".mb-who strong").allTextContents();
  expect(names).toEqual(["Gerald David Adams", "Duncan Douglas Moss", "Sarah Elizabeth Zimmer"]);
  await expect(card.getByText("This list may not be final")).toBeVisible();
  await expect(card).toContainText("Mark one X");
  await expect(card).toContainText("You need to show photo ID");

  await card.getByText("Key dates").click();
  await expect(card.getByText("Last day to register to vote")).toBeVisible();
  await expect(card.locator("li[data-passed='1']")).toContainText("Last day to apply for a proxy vote");
  await expect(card.locator("li[data-passed='1']")).toContainText("(passed)");

  const link = card.getByRole("link", { name: "More about Gerald David Adams, on WhoCanIVoteFor" });
  await expect(link).toHaveAttribute("href", "https://whocanivotefor.co.uk/person/12/");
  await expect(link).toHaveAttribute("rel", /noopener/);

  // The postcode is cleaned before it is sent, and it never goes into the page address.
  expect(calls.elections[0]).toContain("postcode=M94FP");
  expect(page.url()).not.toMatch(/M9|m9|4fp/i);
});

test("says plainly when nothing is scheduled, and when the council next votes", async ({ page }) => {
  await mock(page, { elections: { results: [], next: null } });
  await page.goto("/myBallot");
  await search(page, "SW1A 1AA");
  await expect(page.getByRole("heading", { name: "No election is scheduled for this postcode yet" })).toBeVisible();
  await expect(page.getByText(/Westminster next votes on/)).toBeVisible();
  await expect(page.getByRole("link", { name: "When councils vote" })).toHaveAttribute("href", "#/localElections");
});

test("a bad postcode is caught without asking anyone", async ({ page }) => {
  const calls = await mock(page);
  await page.goto("/myBallot");
  await search(page, "hello");
  await expect(page.getByRole("alert")).toContainText("doesn't look like a UK postcode");
  expect(calls.elections).toHaveLength(0);
});

test("a service failure is explained, and a list that will not load points to another source", async ({ page }) => {
  await mock(page, { electionsStatus: 500 });
  await page.goto("/myBallot");
  await search(page, "M9 4FP");
  await expect(page.getByRole("alert")).toContainText("isn't working right now");

  await page.unroute("**/elections.democracyclub.org.uk/**");
  await page.unroute("**/candidates.democracyclub.org.uk/**");
  await mock(page, { ballotStatus: 500 });
  await search(page, "M9 4FP");
  await expect(page.getByText("We couldn't load the list of people for this contest.")).toBeVisible();
  await expect(page.getByRole("link", { name: "See it on WhoCanIVoteFor" })).toHaveAttribute("href", /whocanivotefor\.co\.uk\/elections\/local\.manchester/);
});

test("a contest nobody has been added to yet says when nominations close", async ({ page }) => {
  await mock(page, { ballot: { candidates_locked: false, candidacies: [] } });
  await page.goto("/myBallot");
  await search(page, "M9 4FP");
  await expect(page.getByText(/Nobody has been added yet. Nominations close on 30 October/)).toBeVisible();
});

test("a phone sees the same thing, and the page never scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await mock(page);
  await page.goto("/myBallot");
  await search(page, "M9 4FP");
  await expect(page.locator(".mb-card")).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test("is part of the Your vote group, next to How to vote", async ({ page }) => {
  await mock(page);
  await page.goto("/howtovote");
  const tabs = page.getByRole("navigation", { name: "Your vote" });
  await expect(tabs.getByRole("link", { name: "Who is on my ballot" })).toBeVisible();
  await tabs.getByRole("link", { name: "Who is on my ballot" }).click();
  await expect(page).toHaveURL(/\/myBallot$/);
  await expect(page.getByRole("heading", { level: 1, name: "Who is on my ballot" })).toBeVisible();
});

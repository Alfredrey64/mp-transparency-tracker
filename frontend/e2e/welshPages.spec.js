import { test, expect } from "@playwright/test";

// The pages that have a Welsh version: How to vote, Who is on my ballot, Compare councils and Accessibility. Welsh runs longer than English, so each is also checked
// on a small phone for anything that would scroll sideways or be cut off.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const welshPages = ["/howtovote", "/myBallot", "/compareCouncils/E06000009~E09000033", "/accessibility"];

test("a translated page is in Welsh all through, with no English-only notice, a Welsh title and the page marked as Welsh", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/howtovote?lang=cy");
  await expect(page.locator(".lang-notice")).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Sut i bleidleisio | Simple Politics");
  await expect(page.getByRole("heading", { level: 1, name: "Sut i bleidleisio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ga i bleidleisio?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pedwar cam i bleidleisio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beth sy'n digwydd ar ôl i chi bleidleisio" })).toBeVisible();
  // "What you're looking at" is Welsh too.
  await page.getByRole("button", { name: /Beth rydych chi'n edrych arno/ }).click();
  await expect(page.getByText("Mae eu gwybod ymlaen llaw yn gwneud i'ch pleidlais gyfrif")).toBeVisible();
});

test("the voting checker works in Welsh, and its answers change with the choices", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/howtovote?lang=cy");
  const tickets = page.locator(".v-ticket");
  await expect(tickets.first()).toContainText("Etholiad cyffredinol y DU");
  await expect(tickets.first()).toContainText("Gallwch bleidleisio");
  await page.getByRole("radio", { name: "16 neu 17" }).click();
  await expect(tickets.first()).toContainText("Ni allwch bleidleisio");
  await expect(tickets.first()).toContainText("Rhaid i chi fod yn 18 oed");
  await page.getByRole("radio", { name: "Cymru" }).click();
  await expect(tickets.nth(1)).toContainText("Senedd Cymru");
  await expect(tickets.nth(1)).toContainText("yng Nghymru");
  await page.getByRole("radio", { name: "Yr Alban" }).click();
  await expect(tickets.nth(1)).toContainText("Senedd yr Alban");
  await expect(tickets.nth(1)).toContainText("yn yr Alban");
  await page.getByRole("radio", { name: "Gogledd Iwerddon" }).click();
  await expect(tickets.nth(1)).toContainText("Cynulliad Gogledd Iwerddon");
});

test("the compare page is Welsh, in the party names and how each council is run too, and shows the rank as a plain number", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/compareCouncils/E06000009~E09000033?lang=cy");
  const main = page.locator("main");
  await expect(page).toHaveTitle("Cymharu cynghorau | Simple Politics");
  const runs = main.getByRole("group", { name: "Pwy sy'n ei redeg" });
  await expect(runs).toContainText("Mwyafrif Llafur");
  await expect(runs).toContainText("Mwyafrif Ceidwadwyr");
  const dep = main.getByRole("group", { name: "Amddifadedd" });
  await expect(dep).toContainText("Safle allan o 296 cyngor yn Lloegr (1 yw'r mwyaf difreintiedig)");
  await expect(dep).not.toContainText("1st");
  await expect(main.getByRole("group", { name: /Treth gyngor, Band D/ })).toContainText("wedi codi 66% ers 2010 i 11");
  await expect(main.getByText(/Mae'r bil yn Blackpool £[\d,]+ yn uwch na'r bil yn Westminster\./)).toBeVisible();
  await expect(main.getByText(/y rhanbarth y mae pob cyngor ynddo \(Gogledd-orllewin Lloegr a Llundain\)/)).toBeVisible();
  await expect(main.getByRole("group", { name: "Cyflog", exact: true })).toBeVisible();
  // Nothing in English is left in the words around the figures.
  await expect(main).not.toContainText(/Who runs it|Council tax|Deprivation|Next election/);
});

test("the compare page's nation sentences are written whole, so each place name is correct", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/compareCouncils/W06000015~S12000049?lang=cy");
  await expect(page.getByText("yng Nghymru, felly nid yw'n cael ei dangos yma")).toBeVisible();
  await expect(page.getByText("yn yr Alban, felly nid yw'n cael ei dangos yma")).toBeVisible();
  await expect(page.getByText(/Ni ellir cymharu: mae pob gwlad yn graddio/).first()).toBeVisible();
});

test("the ballot page is Welsh, with its dates, voting lines and candidate list in Welsh", async ({ page }) => {
  const ELECTION = {
    election_id: "local.manchester.harpurhey.by.2099-11-26", election_title: "Manchester local election Harpurhey by-election", poll_open_date: "2099-11-26",
    timetable: { close_of_nominations: "2099-10-30", registration_deadline: "2099-11-10", postal_vote_application_deadline: "2099-11-11", proxy_vote_application_deadline: "2000-01-01" },
    election_type: { election_type: "local" }, organisation: { common_name: "Manchester" }, division: { name: "Harpurhey" }, group_type: null,
    elected_role: "Local Councillor", seats_contested: 1, voting_system: { slug: "FPTP" }, requires_voter_id: "EA-2022", cancelled: false, by_election_reason: "DEATH", deleted: false,
  };
  const json = (body) => ({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  await page.route("**/elections.democracyclub.org.uk/**", (r) => r.fulfill(json({ results: [ELECTION], next: null })));
  await page.route("**/candidates.democracyclub.org.uk/**", (r) => r.fulfill(json({ candidates_locked: false, candidacies: [{ person: { id: 1, name: "Ann Zed" }, party_name: "Independent" }] })));
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/myBallot?lang=cy");
  await expect(page).toHaveTitle("Pwy sydd ar fy mhapur pleidleisio | Simple Politics");
  await page.getByLabel("Eich cod post").fill("M9 4FP");
  await page.getByRole("button", { name: "Chwilio", exact: true }).click();
  const card = page.locator(".mb-card");
  await expect(page.getByRole("heading", { name: /1 gystadleuaeth ar ddod ar gyfer M9 4FP/ })).toBeFocused();
  await expect(card).toContainText("Cynghorydd");
  await expect(card).toContainText("Isetholiad, a gynhelir ar ôl i'r deiliad blaenorol farw.");
  await expect(card).toContainText("Rhowch un X.");
  await expect(card).toContainText("Mae angen i chi ddangos ID â llun");
  await expect(card).toContainText("diwrnod i fynd");
  await card.getByText("Dyddiadau pwysig").click();
  await expect(card.getByText("Diwrnod olaf i gofrestru i bleidleisio")).toBeVisible();
  await expect(card.getByText(/wedi pasio/)).toBeVisible();
  // The date itself is written in Welsh.
  await expect(card.locator(".mb-when")).toContainText(/Tachwedd|Dydd/);
  await expect(card.getByRole("link", { name: /Rhagor o wybodaeth: Ann Zed/ })).toBeVisible();
});

test("an invalid postcode is refused in Welsh", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/myBallot?lang=cy");
  await page.getByLabel("Eich cod post").fill("nonsense");
  await page.getByRole("button", { name: "Chwilio", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nid yw hynny'n edrych fel cod post yn y DU");
  await expect(page.getByRole("alert")).not.toContainText("doesn't look like");
});

for (const width of [320, 360, 390]) {
  test(`Welsh pages fit a ${width}px phone with nothing sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of welshPages) {
      await page.goto(`${path}?lang=cy`);
      await expect(page.locator("h1")).toBeVisible();
      expect(await sideways(page), `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test("every Welsh page keeps its heading, buttons and links readable at the largest text size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/howtovote?lang=cy");
  await page.getByRole("button", { name: /Hygyrchedd/ }).click();
  await page.getByRole("button", { name: "Mwyaf" }).click();
  await page.keyboard.press("Escape");
  for (const path of welshPages) {
    await page.goto(`${path}?lang=cy`);
    await expect(page.locator("h1")).toBeVisible();
    expect(await sideways(page), `${path} at the largest text`).toBeLessThanOrEqual(0);
  }
});

// A safety net that does not depend on reading the source: with tracking on, every sentence a Welsh page asks the translator for that has no Welsh is noted, and
// there must be none. It covers whatever is really drawn, including strings passed through variables.
test("nothing a Welsh page asks to have translated is missing from the Welsh words", async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => { window.__i18nTrack = true; });
  await page.setViewportSize({ width: 1700, height: 900 });
  const missing = async () => page.evaluate(() => [...(window.__i18nMissing ?? [])]);
  for (const path of welshPages) {
    await page.goto(`${path}?lang=cy`);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(400);
    expect(await missing(), `on ${path}`).toEqual([]);
  }

  // The frame: the menus opened, the search box with results, the accessibility panel, the refer dialog and the footer.
  await page.goto("/howtovote?lang=cy");
  await page.getByRole("button", { name: "Eich ardal" }).hover();
  await page.getByRole("button", { name: "Senedd y DU" }).hover();
  await page.getByRole("button", { name: "Dysgu" }).hover();
  await page.keyboard.press("/");
  const box = page.getByRole("dialog", { name: "Chwilio'r safle" });
  for (const q of ["etholiad", "sir", "treth", "arian"]) {
    await box.getByRole("searchbox").fill(q);
    await page.waitForTimeout(500);
  }
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Hygyrchedd/ }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Cyfeirio at y dudalen hon" }).click();
  await page.keyboard.press("Escape");
  await page.locator("footer").scrollIntoViewIfNeeded();
  expect(await missing(), "in the site's frame").toEqual([]);

  // The error screen and the phone menu.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/myBallot?lang=cy");
  await page.getByLabel("Eich cod post").fill("hello");
  await page.getByRole("button", { name: "Chwilio", exact: true }).click();
  await page.getByRole("button", { name: "Agor y ddewislen" }).click();
  await page.waitForTimeout(300);
  expect(await missing(), "in the phone menu and the postcode error").toEqual([]);
});

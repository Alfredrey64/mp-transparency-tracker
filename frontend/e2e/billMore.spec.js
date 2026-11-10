import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { createRequire } from "node:module";

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const axeIn = (page, selector) => page.evaluate(async ([src, sel]) => { (0, eval)(src); const r = await window.axe.run(document.querySelector(sel) ?? document, { runOnly: ["wcag2a", "wcag2aa"] }); return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`); }, [AXE, selector]);

// Wherever the site gives a one-line summary of what a bill does, a "What it proposes" button under it opens the bill clause by clause in plain English with the
// official wording. The data requests are answered with two made-up bills, so none of this depends on the live database.
const BILLS = [
  { bill_id: 1, short_title: "Glue Traps Bill", long_title: "A Bill to ban the sale of glue traps; to require licences for pest controllers; to amend the Animal Welfare Act 2006; and for connected purposes", current_stage: "Committee stage", current_house: "Commons", sponsoring_department: "DEFRA", is_act: false, is_defeated: false, last_updated: "2026-10-01T00:00:00Z", source_url: "https://bills.parliament.uk/bills/1" },
  { bill_id: 2, short_title: "Rail Bill", long_title: "A Bill to make provision about railways; and for connected purposes", current_stage: "Committee stage", current_house: "Commons", sponsoring_department: "DfT", is_act: false, is_defeated: false, last_updated: "2026-10-02T00:00:00Z", source_url: "https://bills.parliament.uk/bills/2" },
];

async function mockData(page) {
  await page.route("**/127.0.0.1:54321/**", (r) => {
    const url = r.request().url();
    const body = url.includes("/bills") ? BILLS : [];
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  });
}

for (const [label, viewport] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
  test(`where bills currently stand, each bill can open its points (${label})`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport, hasTouch: label === "phone", isMobile: label === "phone" });
    const page = await ctx.newPage();
    await mockData(page);
    await page.goto("/voting");
    await expect(page.getByText("Where bills currently stand")).toBeVisible({ timeout: 15000 });
    // Both bills sit at the same stage: open that stage.
    await page.getByRole("group", { name: "Bill stages in the House of Commons" }).getByRole("button", { name: /^2 Committee/ }).click();
    await expect(page.getByText(/2 bills at .* in the House of Commons/)).toBeVisible();
    // The bill with several clauses has a button; the one with a single clause does not, as it would only repeat the line above it.
    const buttons = page.getByRole("button", { name: /What it proposes/ });
    await expect(buttons).toHaveCount(1);
    await expect(buttons.first()).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("What it proposes, point by point")).toHaveCount(0);
    await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("What it proposes, point by point")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: /^Bans the sale of glue traps$/ })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: /^Requires licences for pest controllers$/ })).toBeVisible();
    await expect(page.getByText(/Official wording: A Bill to ban the sale of glue traps/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "no sideways scroll").toBe(true);
    expect(await axeIn(page, "main"), "axe, panel open").toEqual([]);
    await buttons.first().click();
    await expect(page.getByText("What it proposes, point by point")).toHaveCount(0);
    await ctx.close();
  });
}

// An MP's profile: the "Voting Record" card lists their latest votes, and a vote on a bill with several clauses gets the same button under its summary
// without the row itself (which still goes to the full voting history) changing.
test("an MP's recent votes can open the points of the bill voted on", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const mp = { id: 1, name: "Test Member", party: "Labour", party_colour: "C8102E", constituency: "Testville", thumbnail_url: null, parliament_member_id: 1 };
  const votes = [
    { id: 1, politician_id: 1, division_id: 10, title: "Glue Traps Bill: Third Reading", date: "2026-10-05", voted_aye: true, voted_with_party_majority: true, source_url: "https://example.org/10" },
    { id: 2, politician_id: 1, division_id: 11, title: "Rail Bill: Second Reading", date: "2026-10-03", voted_aye: false, voted_with_party_majority: false, source_url: "https://example.org/11" },
  ];
  await page.route("**/127.0.0.1:54321/**", (r) => {
    const url = r.request().url();
    const wantsOne = (r.request().headers().accept ?? "").includes("pgrst.object");
    let body = [];
    if (url.includes("/politicians")) body = wantsOne ? mp : [mp];
    else if (url.includes("/voting_records")) body = votes;
    else if (url.includes("/bills")) body = BILLS;
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  });
  await page.goto("/mp/1");
  const card = page.locator("section, div").filter({ has: page.getByText("Their 2 most recent recorded votes") }).last();
  await expect(card.getByText("Their 2 most recent recorded votes")).toBeVisible({ timeout: 15000 });
  const toggles = page.getByRole("button", { name: /What it proposes/ });
  await expect(toggles).toHaveCount(1);
  await toggles.first().click();
  await expect(page.getByRole("listitem").filter({ hasText: /^Bans the sale of glue traps$/ })).toBeVisible();
  // Pressing the toggle did not take the page away to the voting history.
  await expect(page.getByText("Their 2 most recent recorded votes")).toBeVisible();
  expect(await axeIn(page, "main"), "axe, points open").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "no sideways scroll").toBe(true);
  await ctx.close();
});

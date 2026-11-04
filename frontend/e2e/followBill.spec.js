import { test, expect } from "@playwright/test";

// Following a bill from its card, and the Watchlist saying where it has got to since it was last looked at. The database is answered by the test.
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };
const bill = (stage) => ({
  bill_id: 101, short_title: "Rail Fares Bill", long_title: "A Bill to cap rail fares and for connected purposes.", current_stage: stage, current_house: "Commons", sponsoring_department: "Department for Transport",
  is_act: false, is_defeated: false, last_updated: "2026-11-02T10:00:00", source_url: "https://bills.parliament.uk/bills/101", sponsor_name: null,
});

async function mock(page, state) {
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (req.method() === "HEAD") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "0-0/0" }, body: "" });
    const url = req.url();
    const body = /\/rest\/v1\/bills/.test(url) ? [bill(state.stage)] : [];
    return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(body) });
  });
}

test("following a bill puts it on the Watchlist, which says when it moves to another stage", async ({ page }) => {
  const state = { stage: "Committee stage" };
  await page.setViewportSize({ width: 1280, height: 900 });
  await mock(page, state);
  await page.goto("/voting");
  await page.getByText("Rail Fares Bill").first().click();
  const follow = page.getByRole("button", { name: "Follow this bill" });
  await follow.click();
  await expect(page.getByRole("button", { name: "Following this bill" })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/watchlist");
  await expect(page.getByRole("heading", { name: "Bills you follow", exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("No change since you last looked")).toBeVisible();

  state.stage = "Report stage";
  await page.reload();
  await expect(page.getByText("Moved from")).toContainText("Committee stage", { timeout: 20000 });
  await expect(page.getByText("Moved from")).toContainText("Report stage");

  // Having been shown, the new stage is the starting point, and the card can be dropped.
  await page.reload();
  await expect(page.getByText("No change since you last looked")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Stop following" }).click();
  await expect(page.getByRole("heading", { name: "Bills you follow", exact: true })).toHaveCount(0);
});

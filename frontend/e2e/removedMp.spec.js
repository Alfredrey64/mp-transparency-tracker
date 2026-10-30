import { test, expect } from "@playwright/test";

// An MP who has left the Commons is taken out of the MPs table (their name stays on the Former MPs page), so an old link to their profile must land somewhere
// helpful, not on a broken page.
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range", "access-control-allow-headers": "*" };

test("an old link to a removed MP's profile opens the list with a note, and the note leads to the Former MPs page", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    // Asked for one row that no longer exists, the data service answers "not found" (406); everything else is an empty list.
    if (req.url().includes("/politicians") && req.url().includes("id=eq.1")) return route.fulfill({ status: 406, contentType: "application/json", headers: cors, body: JSON.stringify({ code: "PGRST116", message: "The result contains 0 rows", details: "", hint: null }) });
    return route.fulfill({ status: 200, contentType: "application/json", headers: { ...cors, "content-range": "*/0" }, body: "[]" });
  });
  await page.goto("/mp/1");
  const note = page.locator(".mp-gone");
  await expect(note).toBeVisible({ timeout: 15000 });
  await expect(note).toContainText("no longer sitting");
  await expect(page.locator("main")).not.toContainText("undefined");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await note.getByRole("link", { name: "Former MPs page" }).click();
  await expect(page).toHaveURL(/formerMps/);
});

// Takes a picture of every section of Your area's "In numbers" view for a Torridge postcode, with the live services answered by this script, so the look can be checked
// without the network. Usage: node e2e/area-shots.mjs <outDir> [width=1280] [baseUrl]   (needs `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321`)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const out = process.argv[2] ?? "area-shots";
const width = Number(process.argv[3] ?? 1280);
const base = process.argv[4] ?? "http://localhost:4178";
fs.mkdirSync(out, { recursive: true });

const result = {
  postcode: "EX39 1AA", latitude: 51.0197, longitude: -4.2043, country: "England", region: "South West", parliamentary_constituency: "Torridge and Tavistock", admin_district: "Torridge", admin_ward: "Bideford East",
  admin_county: "Devon", parish: "Bideford", index_of_multiple_deprivation: 12000, pfa: "Devon & Cornwall", icb: "NHS Devon Integrated Care Board", lsoa: "Torridge 004A", msoa: "Torridge 004", ruc21: "Urban: Nearer to a major town or city", ttwa: "Barnstaple",
  codes: { admin_district: "E07000046", admin_county: "E10000008", admin_ward: "E05011500", parliamentary_constituency_2024: "E14001552", parliamentary_constituency: "E14001552" },
};
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };
const cats = [["violent-crime", 41], ["anti-social-behaviour", 27], ["shoplifting", 14], ["criminal-damage-arson", 11], ["burglary", 6], ["vehicle-crime", 5], ["public-order", 9], ["other-theft", 8], ["drugs", 3]];
const crimes = cats.flatMap(([category, n]) => Array.from({ length: n }, (_, i) => ({ category, month: "2026-09", location: { street: { name: i % 2 ? "On or near High Street" : "On or near Quay" } } })));
const ratings = [5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 2, 1, 5, 5, 4, 5].map((r, i) => ({ FHRSID: i + 1, BusinessName: `Place ${i + 1}`, BusinessType: ["Restaurant/Cafe/Canteen", "Takeaway/sandwich shop", "Pub/bar/nightclub", "Retailers - other"][i % 4], RatingValue: String(r), SchemeType: "FHRS", Distance: 0.1 + i * 0.05, PostCode: "EX39 1AA", RatingDate: "2026-05-01T00:00:00", LocalAuthorityName: "Torridge" }));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem("mp-transparency-my-postcode", "EX39 1AA"));
await page.route("**/127.0.0.1:54321/**", (route) => {
  const req = route.request();
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  if (req.method() === "HEAD") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "0-0/42" }, body: "" });
  return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(req.url().includes("/politicians") ? [{ id: 1, name: "Test Member", party: "Liberal Democrat", party_colour: "FAA61A", thumbnail_url: null, cabinet_role: null }] : []) });
});
await page.route("**/api.postcodes.io/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ status: 200, result }) }));
await page.route("**/data.police.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(route.request().url().includes("crime-last-updated") ? { date: "2026-09-01" } : crimes) }));
await page.route("**/api.ratings.food.gov.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ meta: { totalCount: ratings.length }, establishments: ratings }) }));
await page.route("**/environment.data.gov.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ items: [] }) }));
await page.route("**/services1.arcgis.com/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ features: [] }) }));
await page.route("**/www.planning.data.gov.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ entities: [] }) }));
await page.route("**/elections.democracyclub.org.uk/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ results: [] }) }));

await page.goto(`${base}/myArea/numbers`);
await page.waitForSelector(".mg", { timeout: 30000 });
await page.waitForTimeout(1500);
// Scroll through so every part draws, then shoot each part and the boxes at the top.
await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 140)); } window.scrollTo(0, 0); });
await page.waitForTimeout(2500);
// SEL=".ma-wellbeing,.ma-poverty" takes a picture of each matching card instead of the whole parts.
if (process.env.SEL) {
  const cards = page.locator(process.env.SEL);
  for (let i = 0; i < (await cards.count()); i++) {
    const el = cards.nth(i);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2600);
    await el.screenshot({ path: `${out}/card-${i + 1}.png` });
  }
  console.log("saved to", out);
  await browser.close();
  process.exit(0);
}
const glance = page.locator(".mg-glance");
if (await glance.count()) await glance.first().screenshot({ path: `${out}/0-glance.png` });
const parts = page.locator(".mg");
for (let i = 0; i < (await parts.count()); i++) {
  const el = parts.nth(i);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await el.screenshot({ path: `${out}/part-${i + 1}.png` });
}
console.log("saved to", out);
await browser.close();

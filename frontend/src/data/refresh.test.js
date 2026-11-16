import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// The weekly refresh (scripts/refresh-issue-data.mjs) must name every script that builds an issue page's data file, and the files they write must exist.
const scripts = path.join(process.cwd(), "scripts");
const refresh = fs.readFileSync(path.join(scripts, "refresh-issue-data.mjs"), "utf8");
const workflow = fs.readFileSync(path.join(process.cwd(), "..", ".github", "workflows", "refresh-issue-data.yml"), "utf8");

describe("weekly data refresh", () => {
  const builders = fs.readdirSync(scripts).filter((f) => /^build-.*-data\.mjs$/.test(f) && f !== "build-seo-pages.mjs");
  it("runs every script that builds a data file", () => {
    expect(builders.length).toBeGreaterThanOrEqual(8);
    for (const b of builders) expect(refresh, b).toContain(b);
  });
  it("names data files that exist", () => {
    for (const m of refresh.matchAll(/out: "([^"]+\.json)"/g)) expect(fs.existsSync(path.join(process.cwd(), "src", "data", m[1])), m[1]).toBe(true);
  });
  it("asks the OECD only now and then, and does not fail a run over a short OECD outage", () => {
    // The OECD throttles one address after a few requests; three OECD steps every week got the whole run refused (see the comment in refresh-issue-data.mjs).
    const steps = [...refresh.matchAll(/\{ name: "(\w+)"[^\n]*?oecd: \{ everyDays: (\d+), tolerateDays: (\d+) \}/g)];
    expect(steps.map((s) => s[1]).sort()).toEqual(["abroad", "brexit", "trust"]);
    for (const [, name, every, tolerate] of steps) {
      expect(Number(every), name).toBeGreaterThanOrEqual(14);
      expect(Number(tolerate), name).toBeGreaterThan(Number(every) * 2);
    }
    expect(refresh).toContain("--force");
  });
  it("keeps the Brexit page's quarterly trade figures coming while its OECD part waits", () => {
    // HMRC publishes regional trade every quarter; that must not wait for the OECD's slower, throttled schedule.
    expect(refresh).toMatch(/name: "brexit"[^\n]*otherPartsFlag: "--keep-oecd"/);
    const brexit = fs.readFileSync(path.join(scripts, "build-brexit-data.mjs"), "utf8");
    expect(brexit).toContain("--keep-oecd");
    expect(brexit).toContain("latestRegionalTrade");
    expect(brexit).toContain("gdpBuilt");
  });
  it("is run by a weekly workflow that opens a pull request instead of changing the site", () => {
    expect(workflow).toContain("cron:");
    expect(workflow).toContain("gh pr create");
    expect(workflow).toContain("refresh-issue-data.mjs");
    expect(workflow).not.toMatch(/git push origin main/);
  });
});

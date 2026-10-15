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
  it("is run by a weekly workflow that opens a pull request instead of changing the site", () => {
    expect(workflow).toContain("cron:");
    expect(workflow).toContain("gh pr create");
    expect(workflow).toContain("refresh-issue-data.mjs");
    expect(workflow).not.toMatch(/git push origin main/);
  });
});

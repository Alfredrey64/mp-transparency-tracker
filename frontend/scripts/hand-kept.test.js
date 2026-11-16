import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HAND_KEPT, unclassified } from "./hand-kept.mjs";
import { handKeptDue } from "./audit-content-lib.mjs";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/data");
const listed = fs.readdirSync(dataDir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? fs.readdirSync(path.join(dataDir, e.name)).map((f) => `${e.name}/${f}`) : [e.name])
  .filter((f) => !f.includes(".test."));

describe("hand-typed data is accounted for", () => {
  it("every data file is a hand-kept row, rewritten by a scheduled job, or fixed", () => {
    expect(unclassified(listed), "add each to HAND_KEPT (with a cadence), AUTOMATIC or FIXED in scripts/hand-kept.mjs").toEqual([]);
  });
  it("every row names files that exist, a cadence and a date", () => {
    for (const r of HAND_KEPT) {
      expect(r.every, r.id).toBeGreaterThan(0);
      expect(r.source, r.id).toBeTruthy();
      for (const f of r.files) expect(fs.existsSync(path.join(dataDir, f)), `${r.id}: ${f}`).toBe(true);
      if (r.stamp) expect(fs.existsSync(path.join(dataDir, r.stamp.file)), r.id).toBe(true); else expect(r.checked, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("handKeptDue", () => {
  const now = new Date("2026-11-16T12:00:00Z");
  const row = { files: ["a.js"], every: 30, checked: "2026-10-01", what: "Thing", source: "the source" };
  it("lists a row that is overdue, with what to read and change", () => {
    const [d] = handKeptDue([row], now, () => null);
    expect(d.problem).toMatch(/46 days ago.*every 30.*the source.*src\/data\/a\.js/);
  });
  it("leaves a row alone while it is inside its cadence, and reads a stamp from the file when there is one", () => {
    expect(handKeptDue([row], now, () => "2026-11-01")).toEqual([]);
    expect(handKeptDue([{ ...row, checked: "2020-01-01" }], now, () => "2026-11-10T08:00:00.000Z")).toEqual([]);
  });
  it("says so when no date can be read", () => {
    expect(handKeptDue([{ ...row, checked: undefined }], now, () => null)[0].problem).toMatch(/no readable date/);
  });
});

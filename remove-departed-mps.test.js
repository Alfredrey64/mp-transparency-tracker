import { describe, it, expect } from "vitest";
import { removeDepartedMps } from "./remove-departed-mps.js";

// A stand-in for the database client that records what is asked of it, so the order of the steps can be checked without touching a database.
function fakeDb({ politicians, records = {}, failTable = null, failFormer = false }) {
  const ops = [];
  return {
    ops,
    from(table) {
      const q = { del: false, eq: null, head: false };
      q.select = (_cols, opts) => { q.head = Boolean(opts?.head); return q; };
      q.eq = (col, val) => { q.eqPair = [col, val]; return q; };
      q.delete = () => { q.del = true; return q; };
      q.upsert = (rows) => { ops.push(["upsert", table, rows[0].name]); return Promise.resolve({ error: failFormer ? { message: "write refused" } : null }); };
      q.then = (resolve) => {
        if (q.del) { ops.push(["delete", table, q.eqPair[1]]); return resolve({ error: failTable === table ? { message: "refused" } : null }); }
        if (q.head) return resolve({ count: records[table] ?? 0, error: null });
        return resolve({ data: politicians, error: null });
      };
      return q;
    },
  };
}

const sitting = Array.from({ length: 649 }, (_, i) => ({ id: i + 10, name: `MP ${i}`, constituency: `Seat ${i}`, parliament_member_id: 1000 + i }));
const leaver = { id: 1, name: "Sir Keir Starmer", constituency: "Holborn and St Pancras", parliament_member_id: 4514 };
const currentIds = sitting.map((r) => r.parliament_member_id);
const left = async () => ({ id: 4514, nameDisplayAs: "Sir Keir Starmer", latestParty: { name: "Labour", backgroundColour: "d50000" }, latestHouseMembership: { membershipFrom: "Holborn and St Pancras", membershipEndDate: "2026-09-01T00:00:00", membershipEndReason: "Resignation (Chiltern)" }, thumbnailUrl: "t.jpg" });
const stillSitting = async () => ({ id: 4514, nameDisplayAs: "X", latestHouseMembership: { membershipFrom: "Y", membershipEndDate: null } });
const quiet = { log: () => {} };

describe("removeDepartedMps", () => {
  it("keeps the name first, then takes out the profile's lists, then the profile, and leaves the 649 sitting MPs alone", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver] });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, lookup: left });
    expect(out.removed.map((m) => m.name)).toEqual(["Sir Keir Starmer"]);
    expect(db.ops).toEqual([
      ["upsert", "former_mps", "Sir Keir Starmer"],
      ["delete", "financial_interests", 1], ["delete", "voting_records", 1], ["delete", "written_questions", 1], ["delete", "mp_news", 1],
      ["delete", "politicians", 1],
    ]);
  });
  it("writes the Former MPs entry with the date and plain reason from the Members API", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver] });
    let saved;
    const orig = db.from.bind(db);
    db.from = (t) => { const q = orig(t); const up = q.upsert; q.upsert = (rows, o) => { saved = rows[0]; return up(rows, o); }; return q; };
    await removeDepartedMps(db, currentIds, { ...quiet, lookup: left });
    expect(saved).toMatchObject({ parliament_member_id: 4514, membership_end_date: "2026-09-01", membership_end_reason: "Resigned", constituency: "Holborn and St Pancras" });
  });
  it("changes nothing in a dry run", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver] });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, apply: false, lookup: left });
    expect(out.removed).toHaveLength(1);
    expect(db.ops).toEqual([]);
  });
  it("leaves in place an MP with a standards report or a ministerial gift on record", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver], records: { standards_reports: 1 } });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, lookup: left });
    expect(out.removed).toEqual([]);
    expect(out.kept).toHaveLength(1);
    expect(db.ops).toEqual([]);
  });
  it("leaves in place an MP whom the Members API still shows as sitting", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver] });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, lookup: stillSitting });
    expect(out.removed).toEqual([]);
    expect(db.ops).toEqual([]);
  });
  it("does not delete anything if the name could not be kept in the Former MPs list", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver], failFormer: true });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, lookup: left });
    expect(out.removed).toEqual([]);
    expect(db.ops.filter((o) => o[0] === "delete")).toEqual([]);
  });
  it("keeps the profile if one of its lists could not be cleared, rather than leaving a half-removed MP counted as sitting", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver], failTable: "voting_records" });
    const out = await removeDepartedMps(db, currentIds, { ...quiet, lookup: left });
    expect(out.kept).toHaveLength(1);
    expect(db.ops.some((o) => o[1] === "politicians")).toBe(false);
  });
  it("does nothing if the list of current MPs is too short to trust", async () => {
    const db = fakeDb({ politicians: [...sitting, leaver] });
    const lines = [];
    const out = await removeDepartedMps(db, currentIds.slice(0, 50), { log: (l) => lines.push(l), lookup: left });
    expect(out.removed).toEqual([]);
    expect(db.ops).toEqual([]);
    expect(lines.join("\n")).toMatch(/too few to trust/);
  });
});

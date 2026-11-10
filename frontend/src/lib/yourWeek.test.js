import { describe, it, expect } from "vitest";
import { sinceDay, summariseWeek, loadWeek } from "./yourWeek";

describe("sinceDay", () => {
  it("steps back whole days across a month end", () => {
    expect(sinceDay("2026-11-10", 7)).toBe("2026-11-03");
    expect(sinceDay("2026-11-03", 7)).toBe("2026-10-27");
  });
});

describe("summariseWeek", () => {
  it("counts votes and the ones against the party, newest first", () => {
    const s = summariseWeek({
      votes: [
        { title: "A", date: "2026-11-04", voted_with_party_majority: true },
        { title: "B", date: "2026-11-06", voted_with_party_majority: false },
        { title: "C", date: "2026-11-05", voted_with_party_majority: null },
        { title: "D", date: "2026-11-03", voted_with_party_majority: true },
      ],
      interests: [], news: [], bills: [],
    });
    expect(s.votes.count).toBe(4);
    expect(s.votes.against).toBe(1);
    expect(s.votes.latest.map((v) => v.title)).toEqual(["B", "C", "A"]);
  });
  it("keeps a failed list as null, never as an empty one", () => {
    const s = summariseWeek({ votes: null, interests: null, news: null, bills: null });
    expect(s).toEqual({ votes: null, interests: null, news: null, bills: null });
  });
  it("shows the five most recently moved bills and counts them all", () => {
    const bills = Array.from({ length: 8 }, (_, i) => ({ bill_id: i, short_title: `Bill ${i}`, last_updated: `2026-11-0${i + 1}T10:00:00Z` }));
    const s = summariseWeek({ votes: [], interests: [], news: [], bills });
    expect(s.bills.count).toBe(8);
    expect(s.bills.latest.map((b) => b.short_title)).toEqual(["Bill 7", "Bill 6", "Bill 5", "Bill 4", "Bill 3"]);
  });
});

function fakeDb({ failTable } = {}) {
  const calls = [];
  const rows = { voting_records: [{ title: "V", date: "2026-11-05", voted_with_party_majority: true }], financial_interests: [{ donor_name: "X", value_amount: 100, date_registered: "2026-11-01" }], mp_news: [], bills: [{ bill_id: 1, short_title: "B", last_updated: "2026-11-05T00:00:00Z" }] };
  return {
    calls,
    from(table) {
      const q = { table, filters: [] };
      const chain = {
        select: () => chain, eq: (c, v) => { q.filters.push(["eq", c, v]); return chain; }, gte: (c, v) => { q.filters.push(["gte", c, v]); return chain; },
        order: () => chain, limit: () => chain,
        then: (res, rej) => { calls.push(q); return Promise.resolve(table === failTable ? { data: null, error: new Error("down") } : { data: rows[table], error: null }).then(res, rej); },
      };
      return chain;
    },
  };
}

describe("loadWeek", () => {
  it("asks for the last seven days of votes and news, fourteen of interests, and this MP only", async () => {
    const db = fakeDb();
    const { summary, failed } = await loadWeek(db, 42, "2026-11-10");
    expect(failed).toEqual([]);
    const by = Object.fromEntries(db.calls.map((c) => [c.table, c.filters]));
    expect(by.voting_records).toEqual([["eq", "politician_id", 42], ["gte", "date", "2026-11-03"]]);
    expect(by.financial_interests).toEqual([["eq", "politician_id", 42], ["gte", "date_registered", "2026-10-27"]]);
    expect(by.mp_news).toEqual([["eq", "politician_id", 42], ["gte", "published_date", "2026-11-03"]]);
    expect(summary.votes.count).toBe(1);
  });
  it("reports which query failed and leaves the others", async () => {
    const { summary, failed } = await loadWeek(fakeDb({ failTable: "voting_records" }), 42, "2026-11-10");
    expect(failed).toEqual(["votes"]);
    expect(summary.votes).toBeNull();
    expect(summary.bills.count).toBe(1);
  });
  it("looks up only the bills when the seat has no current MP", async () => {
    const db = fakeDb();
    const { summary } = await loadWeek(db, null, "2026-11-10");
    expect(db.calls.map((c) => c.table)).toEqual(["bills"]);
    expect(summary.votes.count).toBe(0);
  });
});

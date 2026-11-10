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
      interests: [], news: [],
    });
    expect(s.votes.count).toBe(4);
    expect(s.votes.against).toBe(1);
    expect(s.votes.latest.map((v) => v.title)).toEqual(["B", "C", "A", "D"]);
    // oldest first: D, A, C, then B, the one vote against the party
    expect(s.votes.dots.map((d) => d.rebel)).toEqual([false, false, false, true]);
  });
  it("keeps a failed list as null, never as an empty one", () => {
    const s = summariseWeek({ votes: null, interests: null, news: null });
    expect(s).toEqual({ votes: null, interests: null, news: null });
  });
  it("counts the news mentions and shows the newest four", () => {
    const news = Array.from({ length: 6 }, (_, i) => ({ headline: `N${i}`, published_date: `2026-11-0${i + 1}` }));
    const s = summariseWeek({ votes: [], interests: [], news });
    expect(s.news.count).toBe(6);
    expect(s.news.latest.map((n) => n.headline)).toEqual(["N5", "N4", "N3", "N2"]);
  });
});

function fakeDb({ failTable } = {}) {
  const calls = [];
  const rows = { voting_records: [{ title: "V", date: "2026-11-05", voted_with_party_majority: true }], financial_interests: [{ donor_name: "X", value_amount: 100, date_registered: "2026-11-01" }], mp_news: [] };
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
    expect(summary.interests).toHaveLength(1);
  });
  it("looks nothing up when the seat has no current MP", async () => {
    const db = fakeDb();
    const { summary } = await loadWeek(db, null, "2026-11-10");
    expect(db.calls).toEqual([]);
    expect(summary.votes.count).toBe(0);
  });
});

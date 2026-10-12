import { describe, it, expect } from "vitest";
import history from "./electionsHistory.json";
import { GOVERNMENTS, governmentOn } from "./governments";
import { MANIFESTOS, STATUS, manifestosFor } from "./manifestoPledges";
import { GOVERNMENTS as CHART_GOVERNMENTS } from "../lib/governments";

const ids = new Set([...history.elections.map((e) => e.id), "2024"]);

describe("governments since 1945", () => {
  it("run one after another with no gaps", () => {
    expect(GOVERNMENTS[0].from).toBe("1945-07-26");
    for (let i = 1; i < GOVERNMENTS.length; i++) expect(GOVERNMENTS[i].from, GOVERNMENTS[i].id).toBe(GOVERNMENTS[i - 1].to);
    expect(GOVERNMENTS.at(-1).to).toBeNull();
    expect(GOVERNMENTS.slice(0, -1).every((g) => g.to)).toBe(true);
  });

  it("each have a Prime Minister, a way in, and a few changes", () => {
    for (const g of GOVERNMENTS) {
      expect(g.pm, g.id).toBeTruthy();
      expect(g.took.length, g.id).toBeGreaterThan(30);
      expect(g.changes.length, g.id).toBeGreaterThanOrEqual(2);
      expect(g.changes.every((c) => c.length < 260), g.id).toBe(true);
      expect(["l", "c", "lc"]).toContain(g.party);
    }
  });

  it("points only at elections that exist", () => {
    for (const g of GOVERNMENTS) for (const e of g.elections) expect(ids.has(e), `${g.id} ${e}`).toBe(true);
  });

  it("have unique ids", () => {
    expect(new Set(GOVERNMENTS.map((g) => g.id)).size).toBe(GOVERNMENTS.length);
  });

  it("finds the government on a date", () => {
    expect(governmentOn("1982-04-02").id).toBe("thatcher");
    expect(governmentOn("2010-05-11").id).toBe("coalition");
    expect(governmentOn("2022-10-01").id).toBe("truss");
  });

  it("agrees with the list that shades the Britain in numbers charts", () => {
    // That list treats Cameron's coalition and his later majority government as one spell, so it has one entry fewer.
    for (const c of CHART_GOVERNMENTS) {
      const year = Math.floor(c.from);
      const month = Math.round((c.from - year) * 12) + 1;
      const mine = GOVERNMENTS.find((g) => g.from.startsWith(`${year}-${String(month).padStart(2, "0")}`));
      expect(mine, `${c.pm} ${year}-${month}`).toBeTruthy();
      expect(mine.pm.includes(c.pm), c.pm).toBe(true);
    }
    expect(CHART_GOVERNMENTS.at(-1).pm).toBe("Burnham");
  });
});

describe("manifesto pledges", () => {
  it("are only for elections from 1997", () => {
    for (const m of MANIFESTOS) {
      expect(Number(m.election)).toBeGreaterThanOrEqual(1997);
      expect(ids.has(m.election)).toBe(true);
    }
  });

  it("each carry a status, an outcome and a source", () => {
    for (const m of MANIFESTOS) {
      expect(m.pledges.length, m.id).toBeGreaterThanOrEqual(5);
      for (const p of m.pledges) {
        expect(Object.keys(STATUS), `${m.id}: ${p.text}`).toContain(p.status);
        expect(p.note.length, p.text).toBeGreaterThan(15);
        expect(p.source, p.text).toBeTruthy();
      }
    }
  });

  it("belong with the right governments", () => {
    const of = (id) => manifestosFor(GOVERNMENTS.find((g) => g.id === id)).map((m) => m.election);
    expect(of("blair")).toEqual(["1997", "2001", "2005"]);
    expect(of("brown")).toEqual(["2005"]);
    expect(of("coalition")).toEqual(["2010"]);
    expect(of("sunak")).toEqual(["2019"]);
    expect(of("burnham")).toEqual(["2024"]);
    expect(of("thatcher")).toEqual([]);
  });
});

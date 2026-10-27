import { describe, it, expect } from "vitest";
import { summariseLordsVotes, partyLines, hasWhip, votersOf, plainNote, MIN_VOTERS } from "./lordsVotes.js";

const m = (id, party, extra = {}) => ({ memberId: id, name: `Lord ${id}`, party, partyColour: "ff0000", memberFrom: "Life peer", ...extra });
const many = (start, n, party) => Array.from({ length: n }, (_, i) => m(start + i, party));

describe("Lords votes", () => {
  it("reads each peer's side from a division", () => {
    const v = votersOf({ contents: [m(1, "Labour")], notContents: [m(2, "Conservative")] });
    expect(v.map((x) => [x.id, x.side])).toEqual([[1, "c"], [2, "n"]]);
  });

  it("gives a party a line only when enough of it voted and it was not an even split", () => {
    const lines = partyLines(votersOf({ contents: [...many(1, 6, "Labour"), ...many(20, 2, "Green Party"), ...many(40, 3, "Liberal Democrat")], notContents: [...many(10, 2, "Labour"), ...many(30, 2, "Green Party"), ...many(50, 3, "Liberal Democrat")] }));
    expect(lines.get("Labour").line).toBe("c");
    expect(lines.get("Green Party").line).toBeNull();
    expect(lines.get("Liberal Democrat").line).toBeNull();
    expect(MIN_VOTERS).toBe(5);
  });

  it("counts a vote against the party line only in whipped divisions, and never for peers without a whip", () => {
    const whipped = { divisionId: 1, date: "2026-01-02T00:00:00", title: "A bill", isWhipped: true, isGovernmentWin: true, contents: [...many(100, 6, "Labour"), m(90, "Crossbench")], notContents: [m(2, "Labour"), ...many(80, 6, "Crossbench")] };
    const free = { divisionId: 2, date: "2026-01-01T00:00:00", title: "Free vote", isWhipped: false, isGovernmentWin: null, contents: many(100, 6, "Labour"), notContents: [m(2, "Labour")] };
    const out = summariseLordsVotes([whipped, free], { since: "2025-01-01" });
    expect(out.divisions).toBe(2);
    expect(out.whippedDivisions).toBe(1);
    expect(out.peers["2"][5]).toBe(1); // whipped votes
    expect(out.peers["2"][6]).toBe(1); // against
    expect(out.peers["100"][6]).toBe(0);
    expect(out.peers["90"][5]).toBe(0); // crossbench: no whip
    expect(out.list[0].id).toBe(1); // newest first
    expect(out.list[0].rebels).toBe(1);
    expect(out.parties.find((p) => p.name === "Labour").against).toBe(1);
  });

  it("knows which parties have a whip", () => {
    expect(hasWhip("Labour")).toBe(true);
    expect(hasWhip("Crossbench")).toBe(false);
    expect(hasWhip("Bishops")).toBe(false);
    expect(hasWhip(null)).toBe(false);
  });

  it("turns the Lords' description of a motion into plain text", () => {
    expect(plainNote("<p>Viscount Camrose moved amendment 164, to insert the new clause <em>Register of foreign powers</em>. The House divided:</p>")).toBe("Viscount Camrose moved amendment 164, to insert the new clause Register of foreign powers. The House divided:");
    expect(plainNote(null)).toBeNull();
    expect(plainNote("<p>  </p>")).toBeNull();
    expect(plainNote("word ".repeat(200), 50).length).toBeLessThanOrEqual(50);
  });
});

import { describe, expect, it } from "vitest";
import { furthest, summariseBills, sumCounts, nextSitting, ballotRow, sessionStarts, summariseMotions } from "./backbench.js";

const bill = (over) => ({ billId: 1, shortTitle: "A Bill", billTypeId: 7, isAct: false, billWithdrawn: null, isDefeated: false, currentHouse: "Commons", originatingHouse: "Commons", currentStage: { description: "2nd reading", stageSittings: [] }, ...over });

describe("furthest", () => {
  it("reads how far a bill got", () => {
    expect(furthest(bill({ isAct: true }))).toBe("law");
    expect(furthest(bill({ billWithdrawn: "2026-01-01" }))).toBe("withdrawn");
    expect(furthest(bill({ currentStage: { description: "1st reading" } }))).toBe("first");
    expect(furthest(bill({}))).toBe("second");
    expect(furthest(bill({ currentStage: { description: "Report stage" } }))).toBe("later");
    expect(furthest(bill({ currentHouse: "Lords", currentStage: { description: "Committee stage" } }))).toBe("otherHouse");
  });
  it("does not call a Lords bill that is still in the Lords 'in the other House'", () => {
    expect(furthest(bill({ billTypeId: 2, originatingHouse: "Lords", currentHouse: "Lords", currentStage: { description: "Committee stage" } }))).toBe("later");
  });
});

describe("summariseBills", () => {
  it("counts each kind of bill separately", () => {
    const s = summariseBills([bill({}), bill({ isAct: true }), bill({ billTypeId: 8, currentStage: { description: "1st reading" } })]);
    expect(s.ballot).toMatchObject({ total: 2, law: 1, second: 1 });
    expect(s.presentation).toMatchObject({ total: 1, first: 1 });
    expect(s.tenMinute.total).toBe(0);
    expect(sumCounts(s)).toMatchObject({ total: 3, law: 1 });
  });
});

describe("ballotRow", () => {
  it("names the sponsor and the next sitting still to come", () => {
    const b = bill({ currentStage: { description: "2nd reading", stageSittings: [{ date: "2026-10-01T00:00:00" }, { date: "2027-01-15T00:00:00" }] } });
    expect(nextSitting(b, "2026-11-18")).toBe("2027-01-15");
    const row = ballotRow(b, { sponsors: [{ member: { name: "A Member", party: "Green", memberFrom: "Somewhere" } }] }, "2026-11-18");
    expect(row).toMatchObject({ sponsor: "A Member", party: "Green", seat: "Somewhere", next: "2027-01-15" });
  });
  it("keeps the bill's own description (its long title), tidied", () => {
    const row = ballotRow(bill({}), { longTitle: "A Bill to  do\n a thing;  and for connected purposes.", sponsors: [] }, "2026-11-18");
    expect(row.longTitle).toBe("A Bill to do a thing; and for connected purposes.");
    expect(ballotRow(bill({}), null, "2026-11-18").longTitle).toBe("");
  });
});

const motion = (uin, n, over = {}) => ({ UIN: uin, DateTabled: "2026-06-01T00:00:00", SponsorsCount: n, Title: `Motion ${uin}`, PrimarySponsor: { Name: "A", Party: "Labour" }, ...over });

describe("early day motions", () => {
  it("finds where a session began from the motion numbered 1", () => {
    expect(sessionStarts([motion(1, 3, { DateTabled: "2024-07-20T00:00:00" }), motion(2, 3), motion(1, 9, { DateTabled: "2026-05-14T00:00:00" })])).toEqual(["2024-07-20", "2026-05-14"]);
  });
  it("summarises signatures and ignores amendments", () => {
    const rows = [motion(1, 1), motion(2, 6), motion(3, 60, { PrimarySponsor: { Name: "B", Party: "Green" } }), motion(4, 12, { AmendmentSuffix: "A1" })];
    const s = summariseMotions(rows);
    expect(s.total).toBe(3);
    expect(s.top[0]).toMatchObject({ uin: 3, signatures: 60 });
    expect(s.fiftyPlus).toBe(1);
    expect(s.oneSignature).toBe(1);
    expect(s.buckets.map((b) => b.count)).toEqual([1, 1, 0, 0, 1]);
    expect(s.parties[0]).toMatchObject({ party: "Labour", count: 2 });
  });
  it("carries the wording of the most signed motions, so the page can show what each says", () => {
    const rows = [motion(1, 9, { MotionText: "That this House   notes a thing;\nand calls for another." }), motion(2, 3)];
    const s = summariseMotions(rows);
    expect(s.top[0].text).toBe("That this House notes a thing; and calls for another.");
    expect(s.top[1].text).toBe("");
  });
});

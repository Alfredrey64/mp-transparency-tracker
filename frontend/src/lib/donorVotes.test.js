import { describe, it, expect } from "vitest";
import { donorPolicyArea, votesInArea } from "./donorVotes";

const bills = [
  { short_title: "Health Services Bill", sponsoring_department: "Department of Health and Social Care" },
  { short_title: "Rail Bill", sponsoring_department: "Department for Transport" },
];
const mps = [{ id: 1, name: "A" }, { id: 2, name: "B" }, { id: 3, name: "C" }];
const votes = [
  { politician_id: 1, title: "Health Services Bill: Third Reading", date: "2025-03-01", voted_aye: true },
  { politician_id: 2, title: "Health Services Bill: Third Reading", date: "2025-03-01", voted_aye: false },
  { politician_id: 1, title: "Rail Bill: Second Reading", date: "2025-04-01", voted_aye: true },
  { politician_id: 1, title: "Health Services Bill: Report Stage", date: "2025-02-01", voted_aye: true },
  { politician_id: 9, title: "Health Services Bill: Third Reading", date: "2025-03-01", voted_aye: true },
];

describe("votesInArea", () => {
  const r = votesInArea({ votes, bills, mps, category: "Health" });
  it("counts only votes on bills in the policy area, by the MPs given", () => {
    expect(r.aye).toBe(2);
    expect(r.no).toBe(1);
    expect(r.mpsWithVotes).toBe(2);
  });
  it("lists each division once, newest first, with the split", () => {
    expect(r.bills.map((b) => b.title)).toEqual(["Health Services Bill: Third Reading", "Health Services Bill: Report Stage"]);
    expect(r.bills[0]).toMatchObject({ aye: 1, no: 1 });
  });
  it("leaves out MPs who did not vote in the area", () => {
    expect(r.perMp.map((m) => m.name)).toEqual(["A", "B"]);
  });
  it("copes with no votes at all", () => {
    expect(votesInArea({ votes: null, bills, mps, category: "Health" }).bills).toEqual([]);
  });
});

describe("donorPolicyArea", () => {
  it("is null for an unknown donor", () => expect(donorPolicyArea("Totally Unknown Donor 12345")).toBeNull());
  it("is null for no name", () => expect(donorPolicyArea("")).toBeNull());
});

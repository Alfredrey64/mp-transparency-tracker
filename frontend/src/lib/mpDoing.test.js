import { describe, it, expect } from "vitest";
import { doingFromRows, firstTab } from "./mpDoing";

const mp = {
  parliament_member_id: 172, cabinet_role: null,
  recent_activity: {
    contributions: [{ title: "Housing Costs", sittingDate: "x", date: "2026-10-20", hansardUrl: "https://hansard.parliament.uk/x", said: ["First passage.", "Second."], speechCount: 2 }],
    writtenQuestions: [{ heading: "School meals", department: "Department for Education", dateTabled: "2026-10-01", dateAnswered: null, uin: "123" }],
  },
};

describe("what an MP is doing", () => {
  it("turns their stored activity into debates and questions, keeping Parliament's links", () => {
    const d = doingFromRows({ mp });
    expect(d.debates[0]).toMatchObject({ title: "Housing Costs", date: "2026-10-20", url: "https://hansard.parliament.uk/x", said: "First passage.", speeches: 2 });
    expect(d.questions[0]).toMatchObject({ heading: "School meals", answered: null, tabled: "2026-10-01" });
  });
  it("counts votes with and against the party, ignoring any where that is not recorded", () => {
    const votes = [
      { title: "A", date: "2026-10-02", voted_aye: true, voted_with_party_majority: true },
      { title: "B", date: "2026-10-01", voted_aye: false, voted_with_party_majority: false },
      { title: "C", date: "2026-09-30", voted_aye: true, voted_with_party_majority: null },
    ];
    const d = doingFromRows({ mp, votes });
    expect(d.withParty).toEqual({ with: 1, of: 2 });
    expect(d.votes[1].aye).toBe(false);
  });
  it("lists the bills they sponsor and only the committees they are a member of", () => {
    const committees = [{ name: "Treasury Committee", members: [{ parliament_member_id: 172 }] }, { name: "Other", members: [{ parliament_member_id: 5 }] }];
    const bills = [{ bill_id: 9, short_title: "A Bill", current_stage: "Second reading", is_act: false, source_url: "https://bills.parliament.uk/bills/9" }];
    const d = doingFromRows({ mp, committees, bills });
    expect(d.committees).toEqual(["Treasury Committee"]);
    expect(d.bills[0]).toMatchObject({ title: "A Bill", stage: "Second reading", isAct: false });
    expect(d.total).toBe(1 + 1 + 0 + 1 + 1);
  });
  it("copes with an MP with no stored activity", () => {
    const d = doingFromRows({ mp: { parliament_member_id: 1 } });
    expect(d.total).toBe(0);
    expect(firstTab(d)).toBe("debates");
  });
  it("opens on the first tab that has something in it", () => {
    expect(firstTab(doingFromRows({ mp, votes: [] }))).toBe("debates");
    expect(firstTab(doingFromRows({ mp: { parliament_member_id: 1 }, votes: [{ title: "A", date: "2026-10-02", voted_aye: true }] }))).toBe("votes");
    expect(firstTab(doingFromRows({ mp: { parliament_member_id: 1 }, bills: [{ bill_id: 1, short_title: "B" }] }))).toBe("proposed");
  });
});

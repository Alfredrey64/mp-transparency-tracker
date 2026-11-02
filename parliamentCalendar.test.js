import { describe, it, expect } from "vitest";
import { splitStage, tidyEvent, tidyBreak, summariseCalendar, byDay } from "./parliamentCalendar.js";

const ev = (over) => ({ StartDate: "2026-11-10T00:00:00", StartTime: "", CancelledDate: null, Category: "Legislation", House: "Commons", Description: "", SummarisedDetails: "\\nCommons - Main Chamber\\n\\nx", ...over });

describe("splitStage", () => {
  it("splits a bill from its stage after a colon or a dash", () => {
    expect(splitStage("Sporting Events Bill: Remaining Stages")).toEqual({ bill: "Sporting Events Bill", stage: "Remaining Stages" });
    expect(splitStage(" Health Bill - committee stage (day 4)")).toEqual({ bill: "Health Bill", stage: "committee stage (day 4)" });
    expect(splitStage("A Bill")).toEqual({ bill: "A Bill", stage: "" });
  });
});

describe("tidyEvent", () => {
  it("keeps a bill stage with its bill page", () => {
    const t = tidyEvent(ev({ Description: "Financial Services and Markets Bill [HL]: Second Reading", BillName: "Financial Services and Markets Bill [HL]", BillPageLink: "https://bills.parliament.uk/Bills/4129" }));
    expect(t).toMatchObject({ k: "bill", h: "C", t: "Financial Services and Markets Bill [HL]", stage: "Second Reading", url: "https://bills.parliament.uk/Bills/4129" });
  });
  it("drops cancelled events, private meetings and housekeeping", () => {
    expect(tidyEvent(ev({ CancelledDate: "2026-11-01T00:00:00" }))).toBeNull();
    expect(tidyEvent(ev({ Category: "Private Meeting" }))).toBeNull();
    expect(tidyEvent(ev({ Category: "Introduction(s)", House: "Lords" }))).toBeNull();
  });
  it("does not keep the names of members", () => {
    const t = tidyEvent(ev({ Category: "Prime Minister's Question Time", SummarisedDetails: "\\nCommons - Main Chamber\\n\\n\\n\\nSomeone Else", Members: [{ Name: "Someone Else" }] }));
    expect(JSON.stringify(t)).not.toContain("Someone");
    expect(t.t).toBe("Prime Minister's Questions");
  });
  it("shows a committee hearing with its inquiry", () => {
    const t = tidyEvent(ev({ Category: "Oral evidence", StartTime: "09:30", Committee: { Description: "Treasury Committee", Inquiries: [{ Description: "Autumn Budget" }] }, SummarisedDetails: "\\nCommons - Select & Joint Committees\\n\\nTreasury Committee" }));
    expect(t).toMatchObject({ k: "hearing", t: "Treasury Committee", about: "Autumn Budget", time: "09:30" });
  });
  it("tells a bill committee and a delegated legislation committee apart from a hearing", () => {
    const gc = (name) => ev({ Category: "Debate", Committee: { Description: name, Inquiries: [] }, SummarisedDetails: "\\nCommons - General Committee\\n\\nx" });
    expect(tidyEvent(gc("Highways (Financing) Bill")).k).toBe("billcommittee");
    expect(tidyEvent(gc("First Delegated Legislation Committee")).k).toBe("regs");
  });
  it("marks Westminster Hall and Grand Committee business", () => {
    expect(tidyEvent(ev({ Category: "Westminster Hall debate", Description: "Anti-social behaviour", SummarisedDetails: "\\nCommons - Westminster Hall\\n\\nx" })).where).toBe("Westminster Hall");
    expect(tidyEvent(ev({ Category: "Orders and regulations", House: "Lords", Description: "Some Order 2026", SummarisedDetails: "\\nLords - Grand Committee\\n\\nx" })).where).toBe("Grand Committee");
  });
});

describe("tidyBreak", () => {
  it("describes recesses and non-sitting Fridays", () => {
    expect(tidyBreak({ StartDate: "2026-11-05T00:00:00", EndDate: "2026-11-09T00:00:00", Category: "Recess - Commons", House: "Commons" })).toEqual({ house: "Commons", from: "2026-11-05", to: "2026-11-09", label: "Recess" });
    expect(tidyBreak({ StartDate: "2026-11-13T00:00:00", EndDate: "2026-11-13T00:00:00", Category: "Non-sitting Friday - Lords", House: "Lords" })).toEqual({ house: "Lords", from: "2026-11-13", to: "2026-11-13", label: "Not sitting" });
  });
});

describe("summariseCalendar", () => {
  it("keeps events inside the window, drops repeats and orders by day then time", () => {
    const a = ev({ Category: "Westminster Hall debate", Description: "B topic", StartTime: "14:00" });
    const b = ev({ Category: "Westminster Hall debate", Description: "A topic", StartTime: "09:30", StartDate: "2026-11-10T00:00:00" });
    const out = summariseCalendar([a, a, b, ev({ Category: "Westminster Hall debate", Description: "Late", StartDate: "2027-01-01T00:00:00" })], [], { from: "2026-11-02", to: "2026-11-29", generated: "2026-11-02" });
    expect(out.events.map((e) => e.t)).toEqual(["A topic", "B topic"]);
  });
  it("keeps only the breaks that touch the window", () => {
    const out = summariseCalendar([], [
      { StartDate: "2026-10-01T00:00:00", EndDate: "2026-10-05T00:00:00", Category: "Recess - Commons" },
      { StartDate: "2026-11-05T00:00:00", EndDate: "2026-11-09T00:00:00", Category: "Recess - Commons" },
    ], { from: "2026-11-02", to: "2026-11-29", generated: "2026-11-02" });
    expect(out.away).toHaveLength(1);
  });
  it("sorts the main business before committees on the same day", () => {
    const items = [{ d: "2026-11-10", time: "", k: "hearing", t: "b" }, { d: "2026-11-10", time: "", k: "bill", t: "a" }];
    expect(items.sort(byDay).map((i) => i.k)).toEqual(["bill", "hearing"]);
  });
});

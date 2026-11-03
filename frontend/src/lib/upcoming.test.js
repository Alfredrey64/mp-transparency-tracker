import { describe, it, expect } from "vitest";
import { clock, dayShort, statusOn, weeks, billStages, hearings, commonsQuestions, totals, nextRecess, billCommittees } from "./upcoming";

const data = {
  generated: "2026-11-02", from: "2026-11-02", to: "2026-11-15",
  away: [
    { house: "Commons", from: "2026-11-05", to: "2026-11-09", label: "Recess" },
    { house: "Commons", from: "2026-11-06", to: "2026-11-06", label: "Not sitting" },
    { house: "Lords", from: "2026-11-13", to: "2026-11-13", label: "Not sitting" },
  ],
  events: [
    { d: "2026-11-03", h: "C", k: "bill", t: "Health Bill", stage: "second reading", time: "", url: "https://bills.parliament.uk/Bills/1" },
    { d: "2026-11-10", h: "L", k: "bill", t: "Health Bill", stage: "committee stage", time: "" },
    { d: "2026-11-04", h: "C", k: "hearing", t: "Treasury Committee", about: "Budget", time: "09:30" },
    { d: "2026-11-11", h: "C", k: "hearing", t: "Treasury Committee", about: "Budget", time: "14:00" },
    { d: "2026-11-03", h: "C", k: "billcommittee", t: "Highways Bill", time: "09:25" },
    { d: "2026-11-03", h: "C", k: "questions", t: "Defence (including Topical Questions)", time: "11:30" },
    { d: "2026-11-04", h: "C", k: "questions", t: "Prime Minister's Questions", time: "12:00" },
    { d: "2026-11-04", h: "C", k: "debate", t: "A debate", time: "" },
  ],
};

describe("formatting", () => {
  it("writes the time of day the way people say it", () => {
    expect(clock("14:30")).toBe("2.30pm");
    expect(clock("09:00")).toBe("9am");
    expect(clock("00:15")).toBe("12.15am");
    expect(clock("")).toBe("");
  });
  it("writes a day", () => { expect(dayShort("2026-11-10")).toBe("Tue 10 Nov"); });
});

describe("statusOn", () => {
  it("tells recess, a day off, a sitting day and a weekend apart", () => {
    expect(statusOn("2026-11-05", "Commons", data.away)).toBe("recess");
    expect(statusOn("2026-11-06", "Commons", data.away)).toBe("recess");
    expect(statusOn("2026-11-13", "Lords", data.away)).toBe("off");
    expect(statusOn("2026-11-13", "Commons", data.away)).toBe("sitting");
    expect(statusOn("2026-11-07", "Commons", data.away)).toBe("weekend");
  });
});

describe("weeks", () => {
  it("lays out Monday to Friday for each week the file covers", () => {
    const w = weeks(data);
    expect(w).toHaveLength(2);
    expect(w[0].days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(w[0].days[3].C).toBe("recess");
    expect(w[0].days[1].n).toBe(2);
  });
});

describe("the lists", () => {
  it("groups a bill's stages and keeps its page", () => {
    const b = billStages(data);
    expect(b).toHaveLength(1);
    expect(b[0].stages).toHaveLength(2);
    expect(b[0].url).toBe("https://bills.parliament.uk/Bills/1");
  });
  it("groups a committee's hearings by inquiry", () => {
    const h = hearings(data);
    expect(h).toHaveLength(1);
    expect(h[0].dates.map((d) => d.d)).toEqual(["2026-11-04", "2026-11-11"]);
  });
  it("lists Commons questions by day and tidies the topical questions note", () => {
    const q = commonsQuestions(data);
    expect(q[0].items[0].t).toBe("Defence (with topical questions)");
    expect(q[1].items[0].t).toBe("Prime Minister's Questions");
  });
  it("counts bill committee sittings", () => { expect(billCommittees(data)).toEqual([{ bill: "Highways Bill", sittings: 1 }]); });
  it("counts what the window holds", () => {
    const t = totals(data);
    expect(t).toMatchObject({ bills: 1, stages: 2, hearings: 2, committees: 1, debates: 1 });
  });
  it("finds the next recess", () => {
    expect(nextRecess(data, "2026-11-02")).toMatchObject({ house: "Commons", from: "2026-11-05" });
    expect(nextRecess(data, "2026-12-01")).toBeNull();
  });
});

describe("dayView and nextBusyDay", () => {
  it("lists what is on for a day and says when a house is in recess", async () => {
    const { dayView, nextBusyDay, londonToday } = await import("./upcoming");
    const v = dayView(data, "2026-11-03");
    expect(v.inRange).toBe(true);
    expect(v.commons).toBe("sitting");
    expect(v.bills.length + v.hearings.length + v.business.length + v.questions.length).toBeGreaterThan(0);
    expect(dayView(data, "2026-11-05").commons).toBe("recess");
    expect(dayView(data, "2026-12-25").inRange).toBe(false);
    expect(nextBusyDay(data, "2026-11-02").date >= "2026-11-03").toBe(true);
    expect(nextBusyDay(data, "2030-01-01")).toBeNull();
    expect(londonToday(new Date("2026-11-03T23:30:00Z"))).toBe("2026-11-03");
  });
});

import { describe, it, expect } from "vitest";
import { statusOf, summary, byCommittee, overdue, recentReplies, describe as explain, browse } from "./reportsView";

const r = (id, committee, date, due, replies = []) => ({ id, committee, date, due, replies: replies.map((d, i) => ({ id: id * 10 + i, date: d })), title: `T${id}`, number: "", url: "u" });
const data = {
  generated: "2026-11-02",
  reports: [
    r(1, "A Committee", "2026-06-01", "2026-08-01", ["2026-07-20"]),
    r(2, "A Committee", "2026-06-01", "2026-08-01", ["2026-09-01"]),
    r(3, "B Committee", "2026-06-01", "2026-08-01"),
    r(4, "B Committee", "2026-05-01", "2026-07-01"),
    r(5, "A Committee", "2026-10-30", "2026-12-30"),
  ],
};

describe("statusOf", () => {
  it("tells on time, late, overdue and waiting apart", () => {
    expect(data.reports.map((x) => statusOf(x, data.generated))).toEqual(["ontime", "late", "overdue", "overdue", "waiting"]);
  });
});

describe("summary", () => {
  it("counts each kind and works out the share answered of those due", () => {
    const s = summary(data);
    expect(s).toMatchObject({ total: 5, ontime: 1, late: 1, overdue: 2, waiting: 1, due: 4, answered: 2 });
    expect(s.share).toBe(0.5);
    expect(s.medianWait).toBe(Math.round((49 + 92) / 2));
    expect(s.medianLate).toBe(31);
  });
});

describe("the lists", () => {
  it("ranks committees by reports left unanswered and leaves out reports not yet due", () => {
    const c = byCommittee(data);
    expect(c[0]).toEqual({ committee: "B Committee", reports: 2, answered: 0, overdue: 2 });
    expect(c[1]).toEqual({ committee: "A Committee", reports: 2, answered: 2, overdue: 0 });
  });
  it("lists overdue reports longest first", () => {
    const o = overdue(data);
    expect(o.map((x) => x.id)).toEqual([4, 3]);
    expect(o[0].daysOver).toBe(124);
  });
  it("lists the newest replies first with how long they took", () => {
    const n = recentReplies(data);
    expect(n.map((x) => x.id)).toEqual([2, 1]);
    expect(n[0].took).toBe(92);
  });
});

describe("explain (a report in plain words)", () => {
  it("says an answered report was on time or late, and by how much", () => {
    expect(explain(data.reports[0], "2026-11-02")).toMatchObject({ status: "ontime", label: "Answered on time" });
    const late = explain(data.reports[1], "2026-11-02");
    expect(late).toMatchObject({ status: "late", label: "Answered 31 days late" });
    expect(late.replyAt).toBe(100);
    expect(late.todayAt).toBeNull();
  });
  it("counts the days left, or the days overdue, for a report with no reply", () => {
    expect(explain(data.reports[4], "2026-11-02").label).toBe("Reply due in 58 days");
    const over = explain(data.reports[2], "2026-11-02");
    expect(over.label).toBe("93 days overdue");
    expect(over.todayAt).toBe(100);
    expect(over.dueAt).toBeLessThan(100);
  });
});

describe("browse", () => {
  it("filters by status and by words in the title, committee or inquiry", () => {
    expect(browse(data, { filter: "overdue" }).map((x) => x.id)).toEqual([3, 4]);
    expect(browse(data, { filter: "answered" }).map((x) => x.id).sort()).toEqual([1, 2]);
    expect(browse(data, { query: "b committee" }).map((x) => x.id)).toEqual([3, 4]);
    expect(browse(data, {})[0].id).toBe(5);
  });
});

import { describe, expect, it } from "vitest";
import { plain, tidyReport, summariseNao } from "./auditReports.js";

const names = {
  department: new Map([[1, "Home Office"], [2, "Cross-government"]]),
  topic: new Map([[10, "Crime and justice"], [11, "Risk"]]),
  type: new Map([[217, "Value for money"], [218, "Financial audit"]]),
};
const raw = (over) => ({ id: 1, date: "2026-11-13T00:01:00", link: "https://www.nao.org.uk/reports/x/", title: { rendered: "Reducing &amp; checking: a report" }, excerpt: { rendered: "<p>This report looks at it.</p>\n" }, department: [1], topic: [10, 11], report_type: [217], ...over });

describe("plain", () => {
  it("strips tags and entities and the non-breaking hyphen", () => {
    expect(plain("<p>Risk &amp; money‑making</p>")).toBe("Risk & money-making");
  });
});

describe("tidyReport", () => {
  it("labels a report with the Office's own names", () => {
    expect(tidyReport(raw({}), names)).toMatchObject({ title: "Reducing & checking: a report", date: "2026-11-13", departments: ["Home Office"], type: "Value for money", summary: "This report looks at it." });
  });
  it("drops a report with no title or a link that is not the Office's", () => {
    expect(tidyReport(raw({ title: { rendered: "" } }), names)).toBeNull();
    expect(tidyReport(raw({ link: "https://example.com/x" }), names).url).toBe("");
  });
});

describe("summariseNao", () => {
  it("counts reports by department and kind, newest first, and skips repeats and old ones", () => {
    const items = [raw({ id: 1 }), raw({ id: 2, date: "2026-11-18T00:01:00", department: [2], report_type: [218] }), raw({ id: 1 }), raw({ id: 3, date: "2025-01-01T00:00:00" })];
    const s = summariseNao(items, names, { from: "2025-11-18", generated: "2026-11-18" });
    expect(s.total).toBe(2);
    expect(s.reports[0].id).toBe(2);
    expect(s.byDepartment).toEqual([{ name: "Cross-government", count: 1 }, { name: "Home Office", count: 1 }]);
    expect(s.byType.map((t) => t.name).sort()).toEqual(["Accounts audit", "Value for money"]);
  });
});

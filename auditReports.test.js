import { describe, expect, it } from "vitest";
import { plain, tidyReport, summariseNao, sections, fit } from "./auditReports.js";

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

describe("what a report found", () => {
  const html = '<h2 id="a">Background to the report</h2><p>It is a big programme.</p><p>It costs a lot.</p><h2>Scope of the report</h2><p>We looked.</p><h2>Conclusions</h2><p>It did not work&nbsp;well.</p><p>Costs rose.</p>';
  it("splits a report page at its headings", () => {
    expect(sections(html).map((x) => x.heading)).toEqual(["Background to the report", "Scope of the report", "Conclusions"]);
  });
  it("keeps the conclusion as what it found and the background as why it was looked at", () => {
    const r = tidyReport(raw({ content: { rendered: html } }), names);
    expect(r.found).toEqual(["It did not work well.", "Costs rose."]);
    expect(r.why).toEqual(["It is a big programme.", "It costs a lot."]);
    expect(r.scope).toEqual(["We looked."]);
  });
  it("has empty lists when the page has no such sections", () => {
    expect(tidyReport(raw({}), names)).toMatchObject({ found: [], why: [], scope: [] });
  });
  it("cuts at whole paragraphs, or whole sentences if the first is too long", () => {
    expect(fit(["One.", "Two two."], 8)).toEqual(["One."]);
    expect(fit(["Aaa bbb. Ccc ddd. Eee fff."], 20)).toEqual(["Aaa bbb. Ccc ddd."]);
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

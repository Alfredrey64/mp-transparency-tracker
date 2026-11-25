import { describe, expect, it } from "vitest";
import { plain, footnotes, splitMinister, shortRole, parseAdvisers, parseCosts, parseBands, parseReport, perMinister, perBand, latestEdition, htmlAttachment } from "./specialAdvisers.js";

const adviserRow = (min, name, band, sal) => `<tr><td>${min}</td><td>${name}</td><td>${band}</td><td>${sal}</td></tr>`;
const head = "<thead><tr><th scope=\"col\">Appointing Minister</th><th>Special Adviser</th><th>Pay Band</th><th>Salary Band</th></tr></thead>";
const PM = "The Prime Minister, First Lord of the Treasury, Minister for the Civil Service, Minister for the Union – The Rt Hon Sir Keir Starmer KCB KC MP";

function report({ rows = 60, count = 60, bands = true, costs = true } = {}) {
  const advisers = Array.from({ length: rows }, (_, i) => adviserRow(i === 0 ? PM : "Secretary of State for Transport – The Rt Hon Someone MP", i === 1 ? "Ann Example<sup id=\"fnref:4\"><a href=\"#fn:4\">[footnote 4]</a></sup>" : `Person ${String.fromCharCode(65 + (i % 26))}${i}`, 2, "")).join("");
  return `<p>As at 31 March 2026, there were ${count} (155 full-time equivalent) special advisers working across Government. The total Civil Service had 557,635 (523,635 full-time equivalent) civil servants as at March 2026. Special advisers represent 0.03 per cent of the Civil Service workforce.</p>
  <p>The special adviser paybill for the financial year 1 April 2025 to 31 March 2026 was £17.9 million. This includes £0.2 million paid in severance payments.</p>
  ${costs ? `<table><thead><tr><th></th><th>1 April 2025 - 31 March 2026</th><th>1 April 2024 - 31 March 2025</th></tr></thead><tbody><tr><td>Salary Costs</td><td>£12.4m</td><td>£9.5m</td></tr><tr><td>Pension Contributions</td><td>£3.4m</td><td>£2.5m</td></tr><tr><td>Total Pay Costs</td><td>£17.9m</td><td>£16.7m</td></tr></tbody></table>` : ""}
  ${bands ? "<p>Pay Band 1 Junior Special Adviser - £47,525 to £57,459</p><p>Pay Band 2 Special Adviser - £64,850 to £91,067</p><p>Pay Band 3 Senior Special Adviser - £81,650 to £119,254</p><p>Pay Band 4 Special Adviser Leadership - £112,100 to £160,000</p>" : ""}
  <p>This list reflects the special advisers in post as of 31 March 2026, working across the whole of government.</p>
  <table>${head}<tbody>${advisers}</tbody></table>
  <ol><li id="fn:4"><p>Salary temporarily uplifted <a href="#fnref:4" class="reversefootnote">↩</a></p></li></ol>`;
}

describe("plain", () => {
  it("strips tags and turns the report's ligatures back into letters", () => {
    expect(plain("<p>Cabinet Oﬃce &amp; ﬁnance</p>")).toBe("Cabinet Office & finance");
  });
});

describe("splitMinister", () => {
  it("splits the job from the person at the dash, however the dash is written", () => {
    expect(splitMinister(PM)).toEqual({ role: "The Prime Minister, First Lord of the Treasury, Minister for the Civil Service, Minister for the Union", person: "Sir Keir Starmer KCB KC MP" });
    expect(splitMinister("Chancellor of the Exchequer - The Rt Hon Rachel Reeves MP")).toEqual({ role: "Chancellor of the Exchequer", person: "Rachel Reeves MP" });
    expect(splitMinister("Lord President of the Council; Leader of the House of Commons –The Rt Hon Sir Alan Campbell MP").person).toBe("Sir Alan Campbell MP");
    expect(splitMinister("Secretary of State for Energy – The Rt Ed Miliband MP").person).toBe("Ed Miliband MP");
  });
  it("keeps a job with no person, and a dash inside a job", () => {
    expect(splitMinister("Deputy Prime Minister; Lord Chancellor")).toEqual({ role: "Deputy Prime Minister; Lord Chancellor", person: null });
    expect(splitMinister("Minister for X - Y and Z – The Rt Hon A B MP").role).toBe("Minister for X - Y and Z");
  });
  it("shortens only the long Prime Minister title", () => {
    expect(shortRole("The Prime Minister, First Lord of the Treasury, Minister for the Civil Service, Minister for the Union")).toBe("The Prime Minister");
    expect(shortRole("Secretary of State for Education; Minister for Women and Equalities")).toBe("Secretary of State for Education; Minister for Women and Equalities");
  });
});

describe("parseAdvisers", () => {
  const rows = parseAdvisers(report());
  it("reads minister, name, band and salary band, and the footnotes against a name", () => {
    expect(rows[0]).toMatchObject({ role: "The Prime Minister", minister: "Sir Keir Starmer KCB KC MP", band: 2, salary: null });
    expect(rows[1]).toMatchObject({ name: "Ann Example", notes: ["Salary temporarily uplifted"] });
  });
  it("skips the header row and a row without a pay band", () => {
    expect(rows).toHaveLength(60);
    expect(parseAdvisers(`<table>${head}<tbody>${adviserRow("X", "Y", "n/a", "")}</tbody></table>`)).toEqual([]);
  });
  it("writes a salary band as a range", () => {
    expect(parseAdvisers(`<table>${adviserRow("X", "Y", 4, "£155,000-£159,999")}</table>`)[0].salary).toBe("£155,000 to £159,999");
  });
  it("drops a footnote number glued to the end of a name", () => {
    expect(parseAdvisers(`<table>${adviserRow("X", "Sophie Nazemi4<sup id=\"fnref:4\">[footnote 4]</sup>", 4, "")}</table>`)[0].name).toBe("Sophie Nazemi");
  });
});

describe("footnotes, costs and bands", () => {
  it("reads each footnote's text", () => expect(footnotes(report())["4"]).toBe("Salary temporarily uplifted"));
  it("reads the cost table with both years", () => {
    const c = parseCosts(report());
    expect(c.periods).toEqual(["1 April 2025 - 31 March 2026", "1 April 2024 - 31 March 2025"]);
    expect(c.rows[2]).toEqual({ label: "Total Pay Costs", current: 17.9, previous: 16.7 });
  });
  it("reads the four pay bands", () => expect(parseBands(plain(report()))[3]).toEqual({ band: 4, title: "Special Adviser Leadership", from: 112100, to: 160000 }));
});

describe("parseReport", () => {
  it("reads every figure", () => {
    const r = parseReport(report());
    expect(r).toMatchObject({ asAt: "2026-03-31", count: 60, fte: 155, paybill: { period: "1 April 2025 to 31 March 2026", millions: 17.9, severanceMillions: 0.2 }, civilService: { total: 557635, fte: 523635, sharePercent: 0.03 } });
    expect(r.advisers).toHaveLength(60);
  });
  it("refuses a report whose layout has changed rather than guessing", () => {
    expect(() => parseReport(report({ bands: false }))).toThrow(/four pay bands/);
    expect(() => parseReport(report({ costs: false }))).toThrow(/cost table/);
    expect(() => parseReport(report({ rows: 10 }))).toThrow(/list of advisers/);
    expect(() => parseReport(report({ count: 400 }))).toThrow(/every adviser/);
    expect(() => parseReport("<p>nothing</p>")).toThrow(/layout has changed/);
  });
});

describe("counts", () => {
  const advisers = parseAdvisers(report());
  it("counts per minister and per band", () => {
    expect(perMinister(advisers)[0]).toMatchObject({ role: "Secretary of State for Transport", count: 59 });
    expect(perBand(advisers)).toEqual([{ band: 1, count: 0 }, { band: 2, count: 60 }, { band: 3, count: 0 }, { band: 4, count: 0 }]);
  });
});

describe("finding the latest edition", () => {
  it("takes the newest 'numbers and costs' document and its HTML version", () => {
    const col = { links: { documents: [{ title: "Special adviser data releases: numbers and costs, July 2025", base_path: "/a", public_updated_at: "2025-07-17T10:00:00+01:00" }, { title: "Special adviser data releases: numbers and costs, July 2026", base_path: "/b", public_updated_at: "2026-07-30T14:09:29+01:00" }, { title: "Something else", base_path: "/c", public_updated_at: "2026-09-01T10:00:00+01:00" }] } };
    expect(latestEdition(col)).toEqual({ path: "/b", title: "Special adviser data releases: numbers and costs, July 2026", updated: "2026-07-30" });
    expect(latestEdition({})).toBeNull();
    expect(htmlAttachment({ details: { attachments: [{ url: "https://assets.publishing.service.gov.uk/x.pdf" }, { url: "/government/publications/p/p-html" }] } })).toBe("/government/publications/p/p-html");
  });
});

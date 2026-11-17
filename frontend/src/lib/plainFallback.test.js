import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { layProblems, isLay } from "./lay";
import { instrumentPlain, instrumentInShort, instrumentTopic, reportPlain, reportInShort, reportTitle, billInShort } from "./plainFallback";
import { summariseBill } from "./billSummary";
import { plainPoints, plainSentence } from "./billPlain";

// The names of laws and reports are quoted in the summaries and are shown as they are; only the words around them have to be plain.
const unquoted = (t) => t.replace(/“[^”]*”/g, "it");
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const instruments = read("../data/statutoryInstruments.json");
const reports = read("../data/committeeReports.json");
const reportList = reports.reports ?? Object.values(reports).find(Array.isArray) ?? [];
// Real long titles of bills before Parliament, saved so the rule-based wording is tested on what Parliament actually writes.
const bills = read("./fixtures/billTitles.json");

describe("the plain-English check", () => {
  it("catches statute-speak and passes everyday wording", () => {
    expect(isLay("Part 1A of the Planning Act 2004 (inserted by section 58 of the 2025 Act) requires councils to prepare a strategy.")).toBe(false);
    expect(isLay("These rules make provision as to the procedure to be followed.")).toBe(false);
    expect(isLay("Changes the rules on school meals so more children can claim them.")).toBe(true);
    expect(isLay("The Control of Asbestos Regulations 2012 are changed so that firms must keep records.")).toBe(true);
  });
  it("never throws on odd input", () => {
    for (const v of [null, undefined, 0, 12, {}, [], "", "   ", "A".repeat(5000)]) expect(() => layProblems(v)).not.toThrow();
  });
});

describe("laws made by ministers", () => {
  it("turns a name into a topic", () => {
    expect(instrumentTopic("The Road Vehicles (Registration and Licensing) (Amendment No. 2) Regulations 2026")).toBe("Road Vehicles (Registration and Licensing)");
  });
  it("builds a plain summary from the title, department and dates", () => {
    const t = instrumentInShort({ name: "Strategic Planning (Consequential and Miscellaneous Amendments) Regulations 2026", department: "Ministry of Housing, Communities and Local Government", inForce: "2026-11-26" }, "2026-11-17");
    expect(t).toMatch(/small changes to other laws/);
    expect(t).toMatch(/comes into force on 26 November 2026/);
    expect(isLay(t)).toBe(true);
  });
  it("shows every saved instrument in everyday English, whatever its official note says", () => {
    for (const r of instruments.recent) {
      const { text } = instrumentPlain(r, instruments.generated);
      expect(layProblems(unquoted(text), { maxSentence: 60 }), r.name).toEqual([]);
    }
  });
  it("copes with a record that has almost nothing", () => {
    for (const r of [{}, { name: "" }, { name: "X" }, null, undefined]) expect(instrumentPlain(r).text.length).toBeGreaterThan(10);
  });
});

describe("select committee reports", () => {
  it("drops 'Report -' from a title", () => { expect(reportTitle("Report - Are we ready? Building a culture of resilience")).toBe("Are we ready? Building a culture of resilience"); });
  it("builds a plain summary from the committee, its purpose and the deadline", () => {
    const t = reportInShort({ committee: "National Resilience Committee", house: "Lords", title: "Report - Are we ready?", role: "The National Resilience Committee was appointed to consider national resilience.", due: "2027-01-16", replies: [] }, "2026-11-17");
    expect(t).toMatch(/group of peers set up to look at national resilience/);
    expect(t).toMatch(/expected to reply by 16 January 2027/);
  });
  it("shows every saved report in everyday English", () => {
    expect(reportList.length).toBeGreaterThan(50);
    for (const r of reportList) expect(layProblems(unquoted(reportPlain(r, "2026-11-17").text), { maxSentence: 60 }), r.title).toEqual([]);
  });
  it("copes with a record that has almost nothing", () => {
    for (const r of [{}, { title: "" }, null, undefined]) expect(reportPlain(r).text.length).toBeGreaterThan(10);
  });
});

describe("bills", () => {
  it("never leaves a bill without a plain line, and never shows legal wording as that line", () => {
    for (const b of bills) {
      const s = summariseBill(b).summary;
      expect(s, b.long_title).toBeTruthy();
      expect(layProblems(s, { maxSentence: 60 }), `${b.long_title} -> ${s}`).toEqual([]);
    }
  });
  it("never throws on odd bills", () => {
    for (const b of [{}, { long_title: "" }, { long_title: 5 }, { long_title: "A Bill to ;;; ; ;" }, { long_title: `To ${"x ".repeat(900)}` }, { short_title: "Odd Bill", long_title: null }]) {
      expect(() => summariseBill(b)).not.toThrow();
      expect(summariseBill(b).summary).toBeTruthy();
      expect(() => plainPoints(b.long_title)).not.toThrow();
      expect(() => plainSentence(b.long_title)).not.toThrow();
    }
    expect(billInShort({ short_title: "Odd Bill" })).toMatch(/Odd Bill/);
  });
});

describe("the calendar and vote explainers", () => {
  const kinds = ["debate", "statement", "questions", "hearing", "billcommittee", "regs", "bill", "vote", "money", "petition", "standards", "election", "unheard-of"];
  const odd = [undefined, null, "", "   ", 42, "A".repeat(3000), "Bill (Lords) §§ ;; ??", "<b>x</b>"];
  it("always gives an entry something true to say", async () => {
    const { explainEntry } = await import("./entryExplain");
    for (const e of [null, undefined, 5, "x", {}]) expect(explainEntry(e).what.length).toBeGreaterThan(10);
    for (const kind of kinds) for (const title of odd) for (const past of [false, true]) for (const house of ["C", "L", "J", undefined]) {
      const x = explainEntry({ kind, title, past, house });
      expect(x.label && x.what && x.does, `${kind} ${String(title).slice(0, 20)}`).toBeTruthy();
    }
  });
  it("never throws on a vote title", async () => {
    const { explainDivision } = await import("./divisionExplainer");
    for (const t of odd) expect(() => explainDivision(t)).not.toThrow();
  });
});

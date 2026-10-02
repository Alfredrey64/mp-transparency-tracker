import { describe, it, expect } from "vitest";
import { buildMpSummary } from "./mpSummary";
import { financialYearLabel } from "./format";

const NOW = new Date("2026-10-02T12:00:00Z");
const mp = {
  name: "Jane Example",
  party: "Labour",
  constituency: "Exampleton",
  membership_start_date: "2015-05-07",
  cabinet_role: null,
  ipsa_expenses: { year: "26_27", total: 2460.92, previousYear: { year: "25_26", total: 98000 } },
  recent_activity: {
    writtenQuestions: [{ heading: "Wales" }, { heading: "Gaza: Armed Conflict" }, { heading: "Wales" }],
    contributions: [{ title: " Steel Industry ", date: "2026-09-15" }],
  },
};
const byKey = (s, k) => s.items.find((i) => i.key === k)?.text;

describe("buildMpSummary", () => {
  it("states who the MP is, with tenure in whole years", () => {
    const s = buildMpSummary({ politician: mp, now: NOW });
    expect(s.lead).toBe("Jane Example is the Labour MP for Exampleton, and has been an MP since May 2015 (11 years).");
  });

  it("names a government post only when there is one", () => {
    expect(buildMpSummary({ politician: mp, now: NOW }).lead).not.toMatch(/government post/);
    const s = buildMpSummary({ politician: { ...mp, cabinet_role: "Minister of State" }, now: NOW });
    expect(s.lead).toMatch(/government post of Minister of State\.$/);
  });

  it("describes the Speaker as the Speaker", () => {
    const s = buildMpSummary({ politician: { ...mp, party: "Speaker" }, now: NOW });
    expect(s.lead).toMatch(/^Jane Example is the Speaker of the House of Commons and the MP for Exampleton/);
  });

  it("summarises declared interests with counts and amounts only", () => {
    const interests = [
      { category: "Employment and earnings", summary: "Consultant. - £5,000.00", value_amount: 5000, donor_name: "Acme Ltd", date_registered: "2026-06-01" },
      { category: "Employment and earnings - Ongoing paid employment", summary: "Adviser to a firm", value_amount: null, date_registered: "2020-01-01" },
      { category: "Visits outside the UK", summary: "Visit to Italy", value_amount: null, date_registered: "2019-01-01" },
    ];
    const text = byKey(buildMpSummary({ politician: mp, interests, now: NOW }), "money");
    expect(text).toContain("3 entries on the Register of Members' Financial Interests");
    expect(text).toContain("1 carries a declared value, £5,000 in all; the largest is £5,000 (from Acme Ltd).");
    expect(text).toContain("1 was registered in the last 12 months.");
    expect(text).not.toMatch(/\b(large|significant|substantial|high|huge)\b/i);
  });

  it("says plainly when nothing is registered, and omits the outside-work line", () => {
    const s = buildMpSummary({ politician: mp, interests: [], now: NOW });
    expect(byKey(s, "money")).toMatch(/^Nothing is currently listed/);
    expect(byKey(s, "work")).toBeUndefined();
  });

  it("lists ongoing outside work, trimming the trailing amount", () => {
    const interests = [{ category: "Employment and earnings", summary: "Barrister. - £1,200.00", value_amount: 1200 }];
    expect(byKey(buildMpSummary({ politician: mp, interests, now: NOW }), "work")).toBe("Ongoing paid outside work is declared: Barrister.");
  });

  it("marks the current financial year as in progress, and an old one as complete", () => {
    expect(byKey(buildMpSummary({ politician: mp, now: NOW }), "claims")).toBe(
      "£2,461 of business costs (staff, travel, accommodation and office running costs) claimed through IPSA so far in 2026/27, compared with £98,000 in 2025/26."
    );
  });

  it("reports votes against the party as a count and share, not a verdict", () => {
    const votes = { total: 200, partyTotal: 180, against: 9 };
    expect(byKey(buildMpSummary({ politician: mp, votes, now: NOW }), "votes")).toBe(
      "200 recorded Commons votes on this site. In 9 of the 180 where their party had a clear majority position, they voted the other way (5%)."
    );
  });

  it("leaves out the percentage when there are too few votes for it to mean much", () => {
    const votes = { total: 18, partyTotal: 18, against: 1 };
    expect(byKey(buildMpSummary({ politician: mp, votes, now: NOW }), "votes")).toMatch(/voted the other way\.$/);
  });

  it("only says 'mostly' when one category is most of the entries", () => {
    const mk = (cats) => cats.map((category) => ({ category, summary: "x", value_amount: null }));
    const tied = byKey(buildMpSummary({ politician: mp, interests: mk(["Shareholdings", "Visits outside the UK", "Miscellaneous"]), now: NOW }), "money");
    expect(tied).toContain("spread across");
    expect(tied).not.toContain("mostly");
    const clear = byKey(buildMpSummary({ politician: mp, interests: mk(["Shareholdings", "Shareholdings", "Miscellaneous"]), now: NOW }), "money");
    expect(clear).toContain("mostly shareholdings (2) and miscellaneous (1)");
  });

  it("handles zero rebellions, and skips the party comparison for independents", () => {
    const votes = { total: 10, partyTotal: 10, against: 0 };
    expect(byKey(buildMpSummary({ politician: mp, votes, now: NOW }), "votes")).toMatch(/they voted with it\.$/);
    const ind = byKey(buildMpSummary({ politician: { ...mp, party: "Independent" }, votes, now: NOW }), "votes");
    expect(ind).toBe("10 recorded Commons votes on this site.");
  });

  it("summarises activity by topic without repeating headings", () => {
    const text = byKey(buildMpSummary({ politician: mp, questions30d: 3, now: NOW }), "activity");
    expect(text).toContain("covered “Wales” and “Gaza: Armed Conflict”.");
    expect(text).toContain("3 written questions were tabled in the last 30 days.");
    expect(text).toContain("“Steel Industry” on 15 September 2026.");
  });

  it("only mentions committees, gifts and standards when there is something to say, except for a zero standards count", () => {
    const s = buildMpSummary({ politician: mp, now: NOW });
    expect(byKey(s, "committees")).toBeUndefined();
    expect(byKey(s, "gifts")).toBeUndefined();
    expect(byKey(s, "standards")).toBeUndefined();
    const withData = buildMpSummary({ politician: mp, committees: [{ name: "Treasury" }, { name: "Health" }], standardsCount: 0, now: NOW });
    expect(byKey(withData, "committees")).toBe("Sits on 2 select committees: Treasury and Health.");
    expect(byKey(withData, "standards")).toMatch(/^No standards reports are held/);
  });
});

describe("financialYearLabel", () => {
  it("writes IPSA's compact year as a normal financial year", () => {
    expect(financialYearLabel("26_27")).toBe("2026/27");
    expect(financialYearLabel("99_00")).toBe("2099/00");
  });
  it("leaves anything it doesn't recognise alone", () => {
    expect(financialYearLabel("2026-27")).toBe("2026-27");
    expect(financialYearLabel(null)).toBe("");
  });
});

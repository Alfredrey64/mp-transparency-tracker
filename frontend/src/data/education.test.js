import { describe, expect, it } from "vitest";
import { ATTAINMENT, FEE_HISTORY, SCHOOLS, SEND, SOURCES, UNIVERSITY } from "./education";
import { E, academicYear, feeHistory, gap, last, repayments } from "../lib/education";

describe("education data", () => {
  it("keeps every series the same length as its years", () => {
    expect(E.gapIndex.values).toHaveLength(E.gapIndex.years.length);
    for (const g of ["disadvantaged", "notDisadvantaged", "all", "girls", "boys", "ehcPlan", "senSupport", "noSen"]) {
      expect(E.ks4[g].attainment8).toHaveLength(E.ks4.years.length);
      expect(E.ks4[g].grade5).toHaveLength(E.ks4.years.length);
    }
    expect(E.ehcPlans.values).toHaveLength(E.ehcPlans.years.length);
    for (const k of ["pupils", "ehcPlan", "ehcPlanPct", "supportPct", "support"]) expect(E.sen[k]).toHaveLength(E.sen.years.length);
    expect(E.freeMeals.pct).toHaveLength(E.freeMeals.years.length);
    expect(E.keyStage2.readingWritingMaths).toHaveLength(E.keyStage2.years.length);
    expect(E.absence.persistentPct).toHaveLength(E.absence.years.length);
    expect(E.absence.severePct).toHaveLength(E.absence.years.length);
  });
  it("matches the department's headline figures", () => {
    expect(last(E.ehcPlans.values)).toBe(SEND.plans);
    expect(last(E.sen.ehcPlan)).toBe(SEND.ehcInSchools);
    expect(last(E.sen.support)).toBe(SEND.support);
    expect(Math.round(last(E.sen.ehcPlanPct) * 10) / 10).toBe(SEND.ehcShare);
    expect(Math.round(last(E.sen.supportPct) * 10) / 10).toBe(SEND.supportShare);
    expect(Math.round(((last(E.ehcPlans.values) / E.ehcPlans.values.at(-2)) - 1) * 1000) / 10).toBe(SEND.plansChangePct);
    expect(Math.round(((last(E.sen.ehcPlan) + last(E.sen.support)) / last(E.sen.pupils)) * 1000) / 10).toBe(SEND.withSenShare);
    expect(Math.round(last(E.freeMeals.pct) * 10) / 10).toBe(SCHOOLS.freeMeals);
    expect(Math.round(last(E.sen.pupils) / 1e5) / 10).toBe(SCHOOLS.pupils);
    expect(last(E.sen.pupils) - E.sen.pupils.at(-2)).toBeLessThan(0);
  });
  it("matches the key stage 4 gaps on the page", () => {
    const a8 = gap(E.ks4.notDisadvantaged.attainment8, E.ks4.disadvantaged.attainment8);
    expect(a8[0]).toBe(ATTAINMENT.attainment8Gap201819);
    expect(last(a8)).toBe(ATTAINMENT.attainment8Gap);
    expect(a8.at(-2)).toBe(ATTAINMENT.attainment8GapLast);
    expect(last(gap(E.ks4.notDisadvantaged.grade5, E.ks4.disadvantaged.grade5))).toBe(ATTAINMENT.englishMathsGap);
    expect(last(E.gapIndex.values)).toBe(ATTAINMENT.gapIndex);
    expect(E.gapIndex.years[0]).toBe(2010);
  });
  it("shows the gap index narrowing, then widening", () => {
    const v = E.gapIndex.values;
    expect(Math.min(...v)).toBe(3.66);
    expect(v[0]).toBeGreaterThan(v[6]);
    expect(last(v)).toBeGreaterThan(Math.min(...v));
  });
  it("writes academic years", () => {
    expect(academicYear(2024)).toBe("2024/25");
    expect(academicYear(2099)).toBe("2099/00");
  });
  it("brings fees up to today's prices", () => {
    const h = feeHistory();
    expect(h).toHaveLength(FEE_HISTORY.length);
    expect(h[0].real).toBeGreaterThan(h[0].fee * 1.3);
    // The newest fee is from this autumn, so it is in (almost) today's prices already: once later months of prices are published it moves up a little.
    expect(last(h).real).toBeGreaterThanOrEqual(last(h).fee);
    expect(last(h).real).toBeLessThan(last(h).fee * 1.05);
    expect(h.find((x) => x.year === 2024).real).toBeLessThan(h[0].real);
    expect(last(h).fee).toBe(UNIVERSITY.fee2627);
  });
  it("works out repayments as a share of pay above each threshold", () => {
    const r = Object.fromEntries(repayments(40000).map((x) => [x.plan, x.yearly]));
    expect(r["Plan 2"]).toBe(955);
    expect(r["Plan 5"]).toBe(1350);
    expect(r["Postgraduate loan"]).toBe(1140);
    expect(repayments(20000).every((x) => x.yearly === 0)).toBe(true);
  });
  it("keeps the sources as secure addresses", () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
});

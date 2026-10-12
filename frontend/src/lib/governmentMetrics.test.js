import { describe, it, expect } from "vitest";
import jobs from "../data/ons/jobs.json";
import economy from "../data/ons/economy.json";
import { GOVERNMENTS } from "../data/governments";
import { METRICS, formatChange, formatValue, measure, periodStart, prepareSeries } from "./governmentMetrics";

const metric = (id) => METRICS.find((m) => m.id === id);
const gov = (id) => GOVERNMENTS.find((g) => g.id === id);
const NOW = Date.UTC(2026, 9, 12);

describe("periods", () => {
  it("reads years, quarters and months", () => {
    expect(periodStart("1949")).toBe(Date.UTC(1949, 0, 1));
    expect(periodStart("1955-Q2")).toBe(Date.UTC(1955, 3, 1));
    expect(periodStart("1971-02")).toBe(Date.UTC(1971, 1, 1));
    expect(Number.isNaN(periodStart("nonsense"))).toBe(true);
  });
});

describe("measuring a government", () => {
  const monthly = (start, values) => ({ freq: "months", points: values.map((v, i) => [`${start + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`, v]) });
  const m = { id: "t", kind: "rate", unit: "%", decimals: 1 };
  const fake = { id: "x", from: "2000-01-01", to: "2002-01-01" };

  it("averages a rate and reports where it started and ended", () => {
    const prepared = prepareSeries(m, monthly(2000, Array.from({ length: 24 }, (_, i) => i)));
    const r = measure(m, prepared, fake, NOW);
    expect(r.start).toBe(0);
    expect(r.end).toBe(23);
    expect(r.average).toBeCloseTo(11.5, 5);
    expect(r.change).toBe(23);
  });

  it("returns nothing when the series covers too little of the spell", () => {
    const prepared = prepareSeries(m, monthly(2001, Array.from({ length: 12 }, () => 5)));
    expect(measure(m, prepared, fake, NOW)).toBeNull();
  });

  it("returns nothing when the series ended before the spell began", () => {
    const prepared = prepareSeries(m, monthly(1990, Array.from({ length: 24 }, () => 5)));
    expect(measure(m, prepared, { id: "y", from: "2010-01-01", to: "2012-01-01" }, NOW)).toBeNull();
  });

  it("gives a percentage change for amounts", () => {
    const level = { id: "l", kind: "level", unit: "£", decimals: 0 };
    const prepared = prepareSeries(level, monthly(2000, Array.from({ length: 24 }, (_, i) => 100 + i * 10)));
    expect(measure(level, prepared, fake, NOW).change).toBeCloseTo(230, 5);
  });
});

describe("real series", () => {
  it("shows the unemployment of the 1980s and nothing before the series starts", () => {
    const m1 = metric("unemployment");
    const prepared = prepareSeries(m1, jobs.series[m1.series]);
    const thatcher = measure(m1, prepared, gov("thatcher"), NOW);
    expect(thatcher.peak).toBeGreaterThan(10.5);
    expect(thatcher.start).toBeGreaterThan(4);
    expect(measure(m1, prepared, gov("attlee"), NOW)).toBeNull();
    expect(measure(m1, prepared, gov("wilson1"), NOW)).toBeNull();
  });

  it("measures growth in the size of the economy over the Blair years", () => {
    const m1 = metric("size");
    const prepared = prepareSeries(m1, economy.series[m1.series]);
    const blair = measure(m1, prepared, gov("blair"), NOW);
    expect(blair.change).toBeGreaterThan(20);
    expect(blair.change).toBeLessThan(45);
  });
});

describe("formatting", () => {
  it("formats values and changes", () => {
    expect(formatValue(metric("unemployment"), 4.94)).toBe("4.9%");
    expect(formatValue(metric("house"), 272611)).toBe("£272,611");
    expect(formatValue(metric("population"), 69.5)).toBe("69.5 million");
    expect(formatValue(metric("debt"), 94)).toBe("94% of GDP");
    expect(formatChange(metric("unemployment"), 1.8)).toBe("up 1.8 points");
    expect(formatChange(metric("size"), -4.2)).toBe("down 4.2%");
    expect(formatChange(metric("bank"), 0)).toBe("no change");
    expect(formatValue(metric("bank"), null)).toBe("n/a");
  });
});

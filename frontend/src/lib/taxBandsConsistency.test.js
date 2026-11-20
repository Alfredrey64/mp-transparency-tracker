import { describe, expect, it } from "vitest";
import SERIES from "../data/taxSeries.json";
import BANDS from "../data/taxBands.json";

// taxBands.json (behind the "Your pay" calculator) is a second copy of figures the tax-rate series also hold, and nothing rebuilds it. When a Budget changes a rate and only
// taxSeries.json is updated (as the tax-data check and add-tax-change.mjs do), the calculator would quietly keep the old rule. This ties the two together.
const at = (key, year) => {
  let found;
  for (const [date, value] of SERIES[key] ?? []) { if (date <= `${year}-04-06`) found = value; else break; }
  return found;
};

// Every value a series holds at any point in the tax year starting on 6 April of `year` (a rate changed part-way through, as National Insurance did in November 2022 and
// January 2024, is held in the calculator as a blend of the two, so it must lie between them).
const during = (key, year) => {
  const vals = [at(key, year)];
  for (const [date, value] of SERIES[key] ?? []) if (date > `${year}-04-06` && date < `${year + 1}-04-06`) vals.push(value);
  return vals.filter((v) => v != null);
};

describe("the pay calculator's tax years agree with the tax-rate series", () => {
  const years = BANDS.filter((b) => b.y >= 2008);
  it("uses the same personal allowance, rates and thresholds for every year", () => {
    for (const b of years) {
      expect(b.pa, `${b.y} personal allowance`).toBe(at("incomeTax.allowance", b.y));
      expect(b.basicRate, `${b.y} basic rate`).toBe(at("incomeTax.basic", b.y));
      if (b.addFrom != null && at("incomeTax.topStarts", b.y) != null) expect(b.addFrom, `${b.y} additional-rate threshold`).toBe(at("incomeTax.topStarts", b.y));
      const higher = at("incomeTax.higherStarts", b.y);
      if (higher != null) expect(b.basicUpper, `${b.y} basic-rate band`).toBe(higher - b.pa);
      const ni = during("ni.employee", b.y);
      expect(b.ni.main, `${b.y} employee National Insurance`).toBeGreaterThanOrEqual(Math.min(...ni) - 1e-9);
      expect(b.ni.main, `${b.y} employee National Insurance`).toBeLessThanOrEqual(Math.max(...ni) + 1e-9);
      const above = [...during("ni.employeeAbove", b.y), ...(b.y === 2022 ? [3.25] : [])]; // the 2022 Health and Social Care Levy rise added 1.25 points above the limit too
      expect(b.ni.above, `${b.y} employee National Insurance above the upper limit`).toBeGreaterThanOrEqual(Math.min(...above) - 1e-9);
      expect(b.ni.above, `${b.y} employee National Insurance above the upper limit`).toBeLessThanOrEqual(Math.max(...above) + 1e-9);
    }
  });
  it("has a row for each tax year up to the one the series describe", () => {
    const newest = Math.max(...Object.values(SERIES).flatMap((pts) => pts.map(([d]) => Number(d.slice(0, 4)))).filter((y) => y <= new Date().getFullYear()));
    expect(BANDS.at(-1).y, "taxBands.json stops before the newest year in taxSeries.json").toBeGreaterThanOrEqual(newest - 1);
  });
});

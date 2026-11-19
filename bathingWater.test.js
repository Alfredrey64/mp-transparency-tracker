import { describe, it, expect } from "vitest";
import { siteFrom, sitesFrom, latestYear } from "./bathingWater.js";

const item = (over = {}) => ({
  eubwidNotation: "ukc2102-03600",
  name: { _value: "Spittal" },
  samplingPoint: { lat: 55.756856682381226, long: -1.988831300159957 },
  latestComplianceAssessment: { _about: "http://environment.data.gov.uk/data/bathing-water-quality/compliance-rBWD/point/03600/year/2025", complianceClassification: { name: { _value: "Good" } } },
  appointedSewerageUndertaker: { name: { _value: "Northumbrian Water Limited" } },
  district: [{ name: { _value: "Northumberland" } }, "http://statistics.data.gov.uk/id/statistical-geography/E06000057"],
  waterQualityImpactedByHeavyRain: true,
  ...over,
});

describe("bathing waters", () => {
  it("reads a site with its position, rating, year and company", () => {
    expect(siteFrom(item())).toEqual({ id: "ukc2102-03600", name: "Spittal", lat: 55.75686, lon: -1.98883, rating: "Good", year: 2025, company: "Northumbrian Water", district: "Northumberland", heavyRain: true });
  });
  it("reads a district that is a single object rather than a list", () => {
    expect(siteFrom(item({ district: { name: { _value: "Wirral" } } })).district).toBe("Wirral");
  });
  it("keeps a site with no classification yet, with the rating left empty", () => {
    expect(siteFrom(item({ latestComplianceAssessment: undefined })).rating).toBeNull();
  });
  it("drops a site with no position", () => {
    expect(siteFrom(item({ samplingPoint: {} }))).toBeNull();
    expect(sitesFrom([item(), item({ samplingPoint: undefined })])).toHaveLength(1);
  });
  it("finds the year most sites were assessed in", () => {
    const sites = [{ year: 2025 }, { year: 2025 }, { year: 2024 }, { year: null }];
    expect(latestYear(sites)).toBe(2025);
  });
});

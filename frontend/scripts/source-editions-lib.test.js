import { describe, it, expect } from "vitest";
import { pinnedOnsFiles, newestOnsEdition, hbaiEndYear, pinnedHbaiSlug, newestHbaiSlug, pinnedSipriYear, newestSipriYear } from "./source-editions-lib.mjs";
import fs from "node:fs";

const read = (f) => fs.readFileSync(new URL(`./${f}`, import.meta.url), "utf8");

describe("pinned ONS files", () => {
  it("reads the dataset and edition out of a file address, including one built from a template", () => {
    const text = 'const ONS = "x"; { url: `${ONS}/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi/1997to2024/regionalgrossdisposablehouseholdincomeallitlregions2024.xlsx` }';
    expect(pinnedOnsFiles(text)).toEqual([{ dataset: "/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi", edition: "1997to2024" }]);
  });
  it("ignores a dataset page address with no edition and no file", () => {
    expect(pinnedOnsFiles('"https://www.ons.gov.uk/economy/x/datasets/abc"')).toEqual([]);
  });
  it("finds the files the real build scripts read", () => {
    expect(pinnedOnsFiles(read("build-inequality-data.mjs")).map((f) => f.edition)).toEqual(expect.arrayContaining(["financialyearending2025", "1997to2024"]));
    expect(pinnedOnsFiles(read("build-brexit-data.mjs")).map((f) => f.edition)).toContain("mid2025");
  });
  it("names the newest edition from an ONS dataset page", () => {
    expect(newestOnsEdition({ datasets: [{ uri: "/a/datasets/b/mid2026" }, { uri: "/a/datasets/b/mid2025" }] })).toBe("mid2026");
    expect(newestOnsEdition({})).toBeNull();
  });
});

describe("Households Below Average Income", () => {
  it("reads the end year of a release", () => {
    expect(hbaiEndYear("households-below-average-income-for-financial-years-ending-1995-to-2025")).toBe(2025);
    expect(hbaiEndYear("something-else")).toBeNull();
  });
  it("finds the slug the scripts read", () => {
    expect(pinnedHbaiSlug(read("build-inequality-data.mjs"))).toMatch(/ending-1995-to-\d{4}$/);
  });
  it("picks the first release among a collection's documents, skipping other documents", () => {
    const json = { links: { documents: [{ base_path: "/government/collections/child-poverty-strategy" }, { base_path: "/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2026" }, { base_path: "/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" }] } };
    expect(newestHbaiSlug(json)).toBe("households-below-average-income-for-financial-years-ending-1995-to-2026");
    expect(newestHbaiSlug({})).toBeNull();
  });
});

describe("SIPRI", () => {
  it("reads the year in the script and in the page", () => {
    expect(pinnedSipriYear(read("build-defence-data.mjs"))).toBeGreaterThanOrEqual(2025);
    expect(newestSipriYear('<a href="/x/SIPRI-Milex-data-1949-2025_v1.2.xlsx">a</a><a href="/x/SIPRI-Milex-data-1949-2026.xlsx">b</a>')).toBe(2026);
    expect(newestSipriYear("<p>nothing</p>")).toBeNull();
  });
});

describe("yearlyOnsEditions", () => {
  const base = "https://www.ons.gov.uk/x/bulletins";
  it("names the next year's address for each kind of yearly page", async () => {
    const { yearlyOnsEditions } = await import("./source-editions-lib.mjs");
    const text = [`${base}/genderpay/2026`, `${base}/gdhi/1997to2024`, `${base}/income/financialyearending2025`, `${base}/pop/mid2025`, `${base}/proj/2022based`, `${base}/wealth/april2020tomarch2022`, `${base}/uktrade/latest`].join(" ");
    const got = Object.fromEntries(yearlyOnsEditions(text).map((e) => [e.url.split("/").at(-2), e.nextUrl.split("/").at(-1)]));
    expect(got).toEqual({ genderpay: "2027", gdhi: "1997to2025", income: "financialyearending2026", pop: "mid2026", proj: "2024based", wealth: "april2022tomarch2024" });
  });
  it("counts a page once, by its newest edition cited", async () => {
    const { yearlyOnsEditions } = await import("./source-editions-lib.mjs");
    const got = yearlyOnsEditions(`${base}/pay/2025 and ${base}/pay/2026`);
    expect(got).toHaveLength(1);
    expect(got[0].next).toBe("2027");
  });
});

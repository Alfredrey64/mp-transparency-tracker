import { describe, it, expect } from "vitest";
import { pairFromParam, pairPath, nationOf, regionKeyFor, normName, taxFor, deprivationFor, ordinal, pounds, differenceText, SEP } from "./compareCouncils";
import councilsIndex from "../data/councilsIndex.json";
import tax from "../data/councilTaxByCouncil.json";
import deprivation from "../data/deprivation.json";

const byName = (n) => councilsIndex.index.find((c) => c.name === n);

describe("the pair in the address", () => {
  it("reads two council codes", () => {
    expect(pairFromParam(`E08000003${SEP}W06000019`)).toEqual(["E08000003", "W06000019"]);
    expect(pairFromParam("e08000003~s12000033")).toEqual(["E08000003", "S12000033"]);
  });
  it("copes with one, none or junk", () => {
    expect(pairFromParam("E08000003")).toEqual(["E08000003", null]);
    expect(pairFromParam("~E08000003")).toEqual([null, "E08000003"]);
    expect(pairFromParam(null)).toEqual([null, null]);
    expect(pairFromParam("<script>~../../etc")).toEqual([null, null]);
    expect(pairFromParam("E0800000~E080000033")).toEqual([null, null]);
  });
  it("builds the address back", () => {
    expect(pairPath("E08000003", "E08000035")).toBe("#/compareCouncils/E08000003~E08000035");
    expect(pairPath(null, "E08000035")).toBe("#/compareCouncils/~E08000035");
    expect(pairPath(null, null)).toBe("#/compareCouncils");
  });
});

describe("place and region", () => {
  it("knows the nation from the code", () => {
    expect(nationOf({ id: "E08000003" })).toBe("England");
    expect(nationOf({ id: "W06000019" })).toBe("Wales");
    expect(nationOf({ id: "S12000033" })).toBe("Scotland");
    expect(nationOf({ id: "N09000001" })).toBe("Northern Ireland");
    expect(nationOf(undefined)).toBe("UK");
  });
  it("finds the region, from the deprivation file in England and the nation elsewhere", () => {
    expect(regionKeyFor(byName("Manchester"), deprivation)).toBe("nw");
    expect(regionKeyFor(byName("Blaenau Gwent"), deprivation)).toBe("wales");
    expect(regionKeyFor({ id: "S12000033" }, deprivation)).toBe("scotland");
    expect(regionKeyFor(byName("Kent"), deprivation)).toBeNull();
  });
});

describe("council tax", () => {
  it("matches names however the council is titled", () => {
    expect(normName("Manchester Council")).toBe("manchester");
    expect(normName("London Borough of Hackney")).toBe("hackney");
    expect(normName("Tower Hamlets")).toBe("tower hamlets");
    expect(normName("Bath & North East Somerset")).toBe(normName("Bath and North East Somerset"));
  });
  it("gives the latest bill and how much it has risen", () => {
    const t = taxFor(byName("Manchester"), tax);
    expect(t.toYear).toBe(2026);
    expect(t.fromYear).toBe(2010);
    expect(t.latest).toBeGreaterThan(t.first);
    expect(t.rise).toBeCloseTo(((t.latest - t.first) / t.first) * 100, 6);
  });
  it("has no figure where there is no bill of its own, or outside England", () => {
    expect(taxFor(byName("Kent"), tax)).toBeNull();
    expect(taxFor(byName("Blaenau Gwent"), tax)).toBeNull();
    expect(taxFor(byName("Manchester"), null)).toBeNull();
  });
  it("does not mix up councils with similar names", () => {
    const a = taxFor(byName("Newcastle upon Tyne"), tax);
    const b = taxFor({ id: "E07000195", name: "Newcastle-under-Lyme" }, tax);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a.latest).not.toBe(b.latest);
  });
});

describe("deprivation", () => {
  it("ranks English councils, and says how many are ranked", () => {
    const d = deprivationFor(byName("Blackpool"), deprivation);
    expect(d.rank).toBe(1);
    expect(d.of).toBe(deprivation.areas.length);
    expect(d.score).toBeGreaterThan(0);
  });
  it("gives nothing for other nations or unranked councils", () => {
    expect(deprivationFor(byName("Blaenau Gwent"), deprivation)).toBeNull();
    expect(deprivationFor(byName("Kent"), deprivation)).toBeNull();
    expect(deprivationFor(byName("Blackpool"), null)).toBeNull();
  });
});

describe("words and numbers", () => {
  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111, 112, 296].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "111th", "112th", "296th"]);
  });
  it("writes pounds", () => {
    expect(pounds(2547.6)).toBe("£2,548");
    expect(pounds(null)).toBe("no figure");
  });
  it("describes a difference neutrally, or none when equal", () => {
    expect(differenceText(2500, 2200)).toEqual({ more: true, amount: 300 });
    expect(differenceText(2200, 2500)).toEqual({ more: false, amount: 300 });
    expect(differenceText(2200, 2200.4)).toBeNull();
    expect(differenceText(null, 2200)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { buildMeasureIndex, findMeasures, buildCouncilIndex, findCouncils, buildDonorIndex, findDonors } from "./siteSearch";

const refOf = (s) => `${s.sector}.${s.id}`;
const series = [
  { sector: "rates", id: "mortgage-2y", label: "Two-year fixed mortgage rate", sectorLabel: "Interest rates", cdid: "A", dataset: "x" },
  { sector: "housing", id: "mortgage-payment", label: "Monthly mortgage payment on the average home", sectorLabel: "Housing" },
  { sector: "housing", id: "home-energy", label: "Electricity, gas and other fuels", sectorLabel: "Housing", cdid: "E", dataset: "d" },
  { sector: "prices", id: "energy", label: "Electricity, gas and other fuels", sectorLabel: "Prices and bills", cdid: "E", dataset: "d" },
  { sector: "housing", id: "hpi-london", label: "London", sectorLabel: "Housing" },
  { sector: "housing", id: "hpi-uk", label: "Average UK house price", sectorLabel: "Housing" },
  { sector: "regions", id: "pay-ne", label: "North East", sectorLabel: "Regions" },
  { sector: "population", id: "england", label: "England", sectorLabel: "Population" },
];

describe("measures", () => {
  const index = buildMeasureIndex(series, refOf);
  it("lists a shared measure once and leaves out bare place names", () => {
    expect(index.filter((m) => m.label.startsWith("Electricity"))).toHaveLength(1);
    expect(index.map((m) => m.label)).not.toContain("London");
    expect(index.map((m) => m.label)).not.toContain("England");
    expect(index.map((m) => m.label)).not.toContain("North East");
    expect(index.map((m) => m.label)).toContain("Average UK house price");
  });
  it("needs every word and puts the closest title first", () => {
    expect(findMeasures("mortgage", index).map((m) => m.ref)).toEqual(["rates.mortgage-2y", "housing.mortgage-payment"]);
    expect(findMeasures("fixed mortgage rate", index).map((m) => m.ref)).toEqual(["rates.mortgage-2y"]);
    expect(findMeasures("zzz", index)).toEqual([]);
    expect(findMeasures("", index)).toEqual([]);
  });
  it("matches the page name too", () => {
    expect(findMeasures("interest rates fixed", index).map((m) => m.ref)).toEqual(["rates.mortgage-2y"]);
  });
});

describe("councils", () => {
  const index = buildCouncilIndex([{ id: "1", name: "Aberdeen City" }, { id: "2", name: "Aberdeenshire" }, { id: "3", name: "Bath and North East Somerset" }]);
  it("finds by part of a name", () => {
    expect(findCouncils("aberdeen", index).map((c) => c.id)).toEqual(["1", "2"]);
    expect(findCouncils("north east somerset", index).map((c) => c.id)).toEqual(["3"]);
  });
});

describe("donors", () => {
  const index = buildDonorIndex(["Unite the Union", "Unite The Union Ltd"], ["Acme Limited"]);
  it("merges name variants", () => expect(index).toHaveLength(2));
  it("finds a donor by part of a name", () => {
    expect(findDonors("unite", index).map((d) => d.name)).toEqual(["Unite the Union"]);
    expect(findDonors("acme", index)).toHaveLength(1);
  });
});

import { findPages, buildSectionIndex, findSections } from "./siteSearch";

describe("pages", () => {
  const pages = [
    { key: "nhs", label: "The NHS", hint: "Waiting times by region, A&E, staff", aka: ["waiting list"] },
    { key: "voting", label: "How MPs voted", hint: "Every vote, in plain English", aka: ["divisions"] },
    { key: "rebels", label: "MPs who defy their party", hint: "Who breaks ranks", aka: ["rebellion"] },
  ];
  const textsOf = (p) => [p.label, p.hint, ...(p.aka ?? [])];
  it("takes the words in any order and puts a name match first", () => {
    expect(findPages("times waiting", pages, textsOf).map((p) => p.key)).toEqual(["nhs"]);
    expect(findPages("mps", pages, textsOf).map((p) => p.key)).toEqual(["rebels", "voting"]);
    expect(findPages("rebellion", pages, textsOf).map((p) => p.key)).toEqual(["rebels"]);
    expect(findPages("zzz", pages, textsOf)).toEqual([]);
  });
});

describe("inside pages", () => {
  const headings = {
    statutoryInstruments: { title: "Laws made by ministers", heads: ["What are people worried about?", "Words you will meet on this page", "England", "Laws made by ministers"] },
    housing: { title: "Housing", heads: ["Private rents index", "Words you will meet on this page"] },
  };
  const index = buildSectionIndex(headings, (k) => ({ statutoryInstruments: "Laws made by ministers", housing: "Housing" })[k], new Set(["private rents index"]));
  it("lists real section headings only", () => {
    expect(index.map((h) => h.label)).toEqual(["What are people worried about?", "Words you will meet on this page", "Words you will meet on this page"]);
  });
  it("finds a section by its words and says which page it is on", () => {
    expect(findSections("worried", index)).toEqual([expect.objectContaining({ page: "statutoryInstruments", label: "What are people worried about?" })]);
    expect(findSections("words meet housing", index).map((h) => h.page)).toEqual(["housing"]);
  });
});

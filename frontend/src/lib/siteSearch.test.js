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

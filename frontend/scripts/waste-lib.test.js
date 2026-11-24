import { describe, it, expect } from "vitest";
import { readWaste, newestWorkbook } from "./waste-lib.mjs";

const head = ["Year", "Region", "ONS code", "Jpp Order", "Authority", "Authority type", "Residual household waste per household (kg/household) (Ex NI191)", "Percentage of household waste sent for reuse, recycling or composting (Ex NI192)", "Percentage of municipal waste sent to landfill (Ex NI193)", "Collected household waste per person (kg) (Ex BVPI 84a)"];
const rows = (extra = []) => [
  ["Table 3: Selected Waste Indicators"], [], head,
  ["2022-23", "South West", "E07000046", 1, "Torridge District Council", "Collection", 330.4, 0.526, 0, 339],
  ["2023-24", "South West", "E07000046", 1, "Torridge District Council", "Collection", 330, 0.535, 0, 350],
  ["2024-25", "South West", "E07000046", 1, "Torridge District Council", "Collection", 327.2, 0.526, 0, 341.1],
  ["2024-25", "South West", "E10000008", 2, "Devon County Council", "Disposal", 406.5, 0.542, 0.006, 417.4],
  ["2022-23", "Total England", "Total", "Total", "Total", "Total", 509, 0.417, 0.05, 386],
  ["2023-24", "Total England", "Total", "Total", "Total", "Total", 511, 0.423, 0.05, 391],
  ["2024-25", "Total England", "Total", "Total", "Total", "Total", 513.3, 0.42, 0.055, 387],
  ["2024-25", "South West", "E06000099", 3, "Gone Council", "Unitary", "-", "-", "-", "-"],
  ["2023-24", "South West", "E06000098", 3, "Merged Council", "Unitary", 400, 0.4, 0, 300],
  ...extra,
];

describe("waste tables", () => {
  const w = readWaste(rows());
  it("keeps the years in order and each council's figures against them", () => {
    expect(w.years).toEqual(["2022-23", "2023-24", "2024-25"]);
    expect(w.areas.E07000046).toMatchObject({ n: "Torridge District Council", t: "Collection", p: [52.6, 53.5, 52.6], k: [330, 330, 327], c: [339, 350, 341] });
  });
  it("leaves out councils that only dispose of waste, and ones with no figure in the newest year", () => {
    expect(w.areas.E10000008).toBeUndefined();
    expect(w.areas.E06000099).toBeUndefined();
    expect(w.areas.E06000098).toBeUndefined();
  });
  it("takes England from its own total row, not by adding councils up", () => {
    expect(w.england).toEqual({ p: [41.7, 42.3, 42], k: [509, 511, 513], c: [386, 391, 387] });
  });
  it("gives nothing for a table without the expected columns", () => {
    expect(readWaste([["nothing"], ["here"]])).toBeNull();
  });
  it("finds the local authority workbook among a release's files", () => {
    const hit = newestWorkbook([
      { title: "Local authority collected waste from households annual results 2024/25 England data", url: "https://x/WFH.ods" },
      { title: "Local authority collected waste generation annual results 2024/25 (England and regions) and local authority data annual results 2024/25", url: "https://x/LA.ods" },
    ]);
    expect(hit.url).toBe("https://x/LA.ods");
    expect(newestWorkbook([])).toBeNull();
  });
});

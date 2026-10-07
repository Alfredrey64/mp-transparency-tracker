import { describe, it, expect } from "vitest";
import { buildShareParam, parseShareParam } from "./shareLink";

describe("share links", () => {
  it("round-trips a chart with settings", () => {
    const param = buildShareParam({ target: "hpi-london", range: 10, real: true, governments: false });
    expect(param).toBe("hpi-london.10.r");
    expect(parseShareParam(param)).toMatchObject({ target: "hpi-london", range: 10, real: true, governments: false, indexed: false, places: null });
  });

  it("round-trips a places chart", () => {
    const param = buildShareParam({ target: "population-nations", range: 0, indexed: true, places: ["england", "wales"] });
    expect(param).toBe("population-nations.0.i.england+wales");
    expect(parseShareParam(param)).toMatchObject({ range: 0, indexed: true, places: ["england", "wales"] });
  });

  it("ignores nonsense safely", () => {
    expect(parseShareParam("")).toBeNull();
    expect(parseShareParam(null)).toBeNull();
    expect(parseShareParam("x.abc.-").range).toBeNull();
    expect(parseShareParam("x.9999.-").range).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { LANDMARK_VOTES } from "../lib/politicalHistoryData";
import { LANDMARK_EXPLAINERS, explainerFor } from "./landmarkExplainers";

describe("landmark vote explainers", () => {
  it("covers every vote exactly once", () => {
    const missing = LANDMARK_VOTES.filter((v) => !explainerFor(v)).map((v) => v.title);
    expect(missing).toEqual([]);
    const doubled = LANDMARK_VOTES.filter((v) => LANDMARK_EXPLAINERS.filter((e) => v.title.includes(e.match)).length > 1).map((v) => v.title);
    expect(doubled).toEqual([]);
  });
  it("has no entry that matches nothing, and no empty part", () => {
    const unused = LANDMARK_EXPLAINERS.filter((e) => !LANDMARK_VOTES.some((v) => v.title.includes(e.match))).map((e) => e.match);
    expect(unused).toEqual([]);
    for (const e of LANDMARK_EXPLAINERS) for (const k of ["b", "w", "t"]) expect(e[k]?.length, `${e.match} ${k}`).toBeGreaterThan(40);
  });
});

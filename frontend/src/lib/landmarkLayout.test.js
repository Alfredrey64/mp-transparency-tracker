import { describe, it, expect } from "vitest";
import { layoutLandmarks, spanEras, nearestNode, landmarkId, STEP } from "./landmarkLayout";
import { LANDMARK_VOTES } from "./politicalHistoryData";

const ERAS = [{ to: 1831 }, { to: 1900 }, { to: 1945 }, { to: 1978 }, { to: 2009 }, { to: Infinity }];
const themes = [...new Set(LANDMARK_VOTES.map((v) => v.theme))].map((key) => ({ key, color: "#000" }));
const eras = spanEras(ERAS, LANDMARK_VOTES);

describe("landmark chart layout", () => {
  for (const width of [300, 360, 600, 900]) {
    it(`places every vote, with no two dots touching, at ${width}px wide`, () => {
      const l = layoutLandmarks({ votes: LANDMARK_VOTES, eras, themes, width });
      expect(l.nodes).toHaveLength(LANDMARK_VOTES.length);
      for (const n of l.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x).toBeLessThanOrEqual(width); }
      for (let i = 0; i < l.nodes.length; i++) for (let j = i + 1; j < l.nodes.length; j++) {
        const a = l.nodes[i], b = l.nodes[j];
        if (a.theme !== b.theme) continue;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(STEP - 0.5);
      }
    });
  }
  it("spans the eras from the earliest vote to the latest", () => {
    expect(eras[0].start).toBe(Math.min(...LANDMARK_VOTES.map((v) => v.year)));
    expect(eras.at(-1).end).toBe(Math.max(...LANDMARK_VOTES.map((v) => v.year)));
  });
  it("finds the nearest dot only when one is close", () => {
    const l = layoutLandmarks({ votes: LANDMARK_VOTES, eras, themes, width: 600 });
    const n = l.nodes[0];
    expect(nearestNode(l.nodes, n.x + 2, n.y + 2)?.id).toBe(n.id);
    expect(nearestNode(l.nodes, -500, -500)).toBeNull();
  });
  it("gives every vote its own address", () => {
    expect(new Set(LANDMARK_VOTES.map(landmarkId)).size).toBe(LANDMARK_VOTES.length);
  });
});

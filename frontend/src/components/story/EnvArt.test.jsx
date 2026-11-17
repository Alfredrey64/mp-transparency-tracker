import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnergyScene, EnvironmentScene, WaterScene, FloodScene } from "./EnvArt";

describe("the heading-band scenes on the Environment and energy pages", () => {
  const scenes = { energy: EnergyScene, nature: EnvironmentScene, water: WaterScene, flood: FloodScene };
  for (const [kind, Scene] of Object.entries(scenes)) {
    it(`draws the ${kind} scene as decoration only`, () => {
      const html = renderToStaticMarkup(<Scene />);
      expect(html).toContain(`data-kind="${kind}"`);
      expect(html).toMatch(/class="hs-scene"[^>]*aria-hidden="true"/);
      expect(html).not.toContain('role="img"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    });
  }
});

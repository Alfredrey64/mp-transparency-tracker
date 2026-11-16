import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EconomyScene, JobsScene, FinanceScene, TaxScene, BusinessScene } from "./EconArt";

describe("the heading-band scenes on the Economy and tax pages", () => {
  const scenes = { economy: EconomyScene, jobs: JobsScene, finance: FinanceScene, taxes: TaxScene, business: BusinessScene };
  for (const [kind, Scene] of Object.entries(scenes)) {
    it(`draws the ${kind} scene as decoration only`, () => {
      const html = renderToStaticMarkup(<Scene />);
      expect(html).toContain(`data-kind="${kind}"`);
      expect(html).toMatch(/class="hs-scene"[^>]*aria-hidden="true"/);
      expect(html).not.toContain('role="img"');
      expect(html).not.toContain("NaN");
    });
  }
});

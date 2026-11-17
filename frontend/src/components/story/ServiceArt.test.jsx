import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EducationScene, TransportScene, JusticeScene, CrimeScene, DigitalScene } from "./ServiceArt";

describe("the heading-band scenes on the Public services pages", () => {
  const scenes = { education: EducationScene, transport: TransportScene, justice: JusticeScene, crime: CrimeScene, digital: DigitalScene };
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

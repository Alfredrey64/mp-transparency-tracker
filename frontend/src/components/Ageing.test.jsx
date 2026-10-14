import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Ageing from "./Ageing";

describe("Ageing and pensions page", () => {
  for (const tab of ["overview", "pension", "cost", "people", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Ageing param={tab} />);
      expect(html).toContain(">Ageing and pensions<");
      expect(html).toContain(`id="age-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("shows the main figures", () => {
    const html = renderToStaticMarkup(<Ageing param="overview" />);
    expect(html).toContain("£241.30");
    expect(html).toContain("£12,548");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Ageing param="nothing" />)).toContain('id="age-tab-overview" aria-selected="true"');
  });
});

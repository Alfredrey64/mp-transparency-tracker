import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Defence from "./Defence";

describe("Defence page", () => {
  for (const tab of ["overview", "spending", "people", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Defence param={tab} />);
      expect(html).toContain(">Defence<");
      expect(html).toContain(`id="def-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("shows the main figures", () => {
    const html = renderToStaticMarkup(<Defence param="overview" />);
    expect(html).toContain("2.3%");
    expect(html).toContain("3.5%");
    expect(html).toContain("182,980");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Defence param="nothing" />)).toContain('id="def-tab-overview" aria-selected="true"');
  });
});

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
  it("has the comparison, ranking and cost tools", () => {
    const spending = renderToStaticMarkup(<Defence param="spending" />);
    expect(spending).toContain("Compare countries");
    expect(spending).toContain("Where the UK stands in 2025");
    expect(spending).toContain("Moments behind the line");
    expect(spending).toContain(">Poland<");
    const overview = renderToStaticMarkup(<Defence param="overview" />);
    expect(overview).toContain("What would a target cost?");
    expect(overview).toContain("The short version");
    expect(renderToStaticMarkup(<Defence param="people" />)).toContain("How the forces have changed since 2012");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Defence param="nothing" />)).toContain('id="def-tab-overview" aria-selected="true"');
  });
});

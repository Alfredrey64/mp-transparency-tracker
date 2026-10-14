import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Inequality from "./Inequality";

const TABS = ["overview", "income", "wealth", "poverty", "place", "groups", "debate", "about"];

describe("Inequality page", () => {
  for (const tab of TABS) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Inequality param={tab} />);
      expect(html).toContain("<h1");
      expect(html).toContain(">Inequality<");
      expect(html).toContain('role="tablist"');
      expect(html).toContain(`id="ineq-tab-${tab}" aria-selected="true"`.replace(/ /g, " "));
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      // No dashes standing in for a pause or a range, and no arrows.
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      if (tab !== "debate") expect(html).toContain("Source");
    });
  }
  it("says what the Gini and the main figures are", () => {
    const html = renderToStaticMarkup(<Inequality param="overview" />);
    expect(html).toContain("32.7%");
    expect(html).toContain("5.6 times");
    expect(html).toContain("£39,200");
    expect(html).toContain("13.4 million");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Inequality param="nothing" />)).toContain('id="ineq-tab-overview" aria-selected="true"');
  });
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Union from "./Union";

describe("The devolution and the union page", () => {
  for (const tab of ["overview", "money", "economy", "place", "powers", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Union param={tab} />);
      expect(html).toContain(">Devolution and the union<");
      expect(html).toContain(`id="un-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object|Infinity|\$\{/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      if (tab !== "powers") expect(html).toContain("Source");
    });
  }
  it("has the short version and the main tools", () => {
    expect(renderToStaticMarkup(<Union param="overview" />)).toContain("The short version");
    const money = renderToStaticMarkup(<Union param="money" />);
    for (const t of ["What is spent on services in each place", "What it is spent on", "What each place raises and receives"]) expect(money).toContain(t);
    expect(renderToStaticMarkup(<Union param="economy" />)).toContain("How much each place produces");
    expect(renderToStaticMarkup(<Union param="place" />)).toContain("Money and the economy by place");
    expect(renderToStaticMarkup(<Union param="powers" />)).toContain("Who decides what");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Union param="nothing" />)).toContain('id="un-tab-overview" aria-selected="true"');
  });
});

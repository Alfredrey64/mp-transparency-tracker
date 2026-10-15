import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Transport from "./Transport";

describe("The transport page", () => {
  for (const tab of ["overview", "roads", "rail", "buses", "place", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Transport param={tab} />);
      expect(html).toContain(">Transport<");
      expect(html).toContain(`id="to-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object|Infinity|\$\{/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("has the short version and the main tools", () => {
    expect(renderToStaticMarkup(<Transport param="overview" />)).toContain("The short version");
    const roads = renderToStaticMarkup(<Transport param="roads" />);
    for (const t of ["How much we drive", "What new cars run on", "The state of local roads", "Road deaths", "Transport and climate"]) expect(roads).toContain(t);
    expect(renderToStaticMarkup(<Transport param="rail" />)).toContain("Who runs the trains");
    expect(renderToStaticMarkup(<Transport param="buses" />)).toContain("Who decides how buses run");
    expect(renderToStaticMarkup(<Transport param="place" />)).toContain("Cars, roads and buses by place");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Transport param="nothing" />)).toContain('id="to-tab-overview" aria-selected="true"');
  });
});

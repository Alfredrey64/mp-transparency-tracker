import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Brexit from "./Brexit";

const TABS = ["overview", "economy", "trade", "society", "politics", "arguments", "about"];

describe("Brexit page", () => {
  for (const tab of TABS) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Brexit param={tab} />);
      expect(html).toContain(">Brexit<");
      expect(html).toContain(`id="bx-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("shows the main figures, with who made each estimate", () => {
    const overview = renderToStaticMarkup(<Brexit param="overview" />);
    expect(overview).toContain("51.9%");
    expect(overview).toContain("57%");
    expect(overview).toContain("2% to 6%");
    const economy = renderToStaticMarkup(<Brexit param="economy" />);
    expect(economy).toContain("6% to 8% smaller");
    expect(economy).toContain("4% to 8% bigger");
    expect(economy).toContain("A model of a possible future, not a measurement");
    expect(economy).toContain("4% lower");
    expect(economy).toContain("15% lower");
  });
  it("sets out both sides of every argument and tags how firm the evidence is", () => {
    const html = renderToStaticMarkup(<Brexit param="arguments" />);
    expect((html.match(/Supporters of leaving say/g) ?? []).length).toBe(7);
    expect((html.match(/Critics say/g) ?? []).length).toBe(7);
    expect(html).toContain("A matter of values");
    expect(html).toContain("Counted");
    expect(html).toContain("Estimated");
    expect(html).toContain("Contested");
  });
  it("has the short version, the trend charts and the regional tools", () => {
    const overview = renderToStaticMarkup(<Brexit param="overview" />);
    expect(overview).toContain("The short version");
    expect(overview).toContain("How things have changed");
    expect(renderToStaticMarkup(<Brexit param="economy" />)).toContain("How the UK economy has done against others");
    const trade = renderToStaticMarkup(<Brexit param="trade" />);
    expect(trade).toContain("UK goods trade since 2010");
    expect(trade).toContain("Trade in goods by nation since the deal began");
    const society = renderToStaticMarkup(<Brexit param="society" />);
    expect(society).toContain("Where the country voted, and where people have come to live");
    expect(society).toContain("Arriving and leaving");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Brexit param="nothing" />)).toContain('id="bx-tab-overview" aria-selected="true"');
  });
});

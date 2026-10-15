import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Trust from "./Trust";

describe("The trust in politics page", () => {
  for (const tab of ["overview", "trust", "voting", "money", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Trust param={tab} />);
      expect(html).toContain(">Trust in politics<");
      expect(html).toContain(`id="tr-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object|Infinity/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      if (tab !== "money") expect(html).toContain("Source");
    });
  }
  it("has the short version and the main tools", () => {
    expect(renderToStaticMarkup(<Trust param="overview" />)).toContain("The short version");
    const trust = renderToStaticMarkup(<Trust param="trust" />);
    for (const t of ["How much people trust each part of government", "How the UK compares", "Do people feel heard?"]) expect(trust).toContain(t);
    const voting = renderToStaticMarkup(<Trust param="voting" />);
    for (const t of ["How many people vote", "What the votes turned into in 2024", "Votes for each seat won"]) expect(voting).toContain(t);
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Trust param="nothing" />)).toContain('id="tr-tab-overview" aria-selected="true"');
  });
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Nhs from "./Nhs";

describe("The NHS page", () => {
  for (const tab of ["overview", "waiting", "emergency", "money", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Nhs param={tab} />);
      expect(html).toContain(">The NHS<");
      expect(html).toContain(`id="hl-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("has the short version, the standards and the regional map", () => {
    expect(renderToStaticMarkup(<Nhs param="overview" />)).toContain("The short version");
    expect(renderToStaticMarkup(<Nhs param="overview" />)).toContain("Where the NHS is against its standards");
    const waiting = renderToStaticMarkup(<Nhs param="waiting" />);
    expect(waiting).toContain("Where the waits are");
    expect(waiting).toContain("Has it improved where you live?");
    expect(renderToStaticMarkup(<Nhs param="money" />)).toContain("How the UK compares");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Nhs param="nothing" />)).toContain('id="hl-tab-overview" aria-selected="true"');
  });
});

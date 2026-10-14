import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Education from "./Education";

describe("Education page", () => {
  for (const tab of ["overview", "gaps", "send", "university", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Education param={tab} />);
      expect(html).toContain(">Education<");
      expect(html).toContain(`id="edu-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("shows the main figures", () => {
    expect(renderToStaticMarkup(<Education param="gaps" />)).toContain("15.5 points");
    expect(renderToStaticMarkup(<Education param="send" />)).toContain("718,838");
    expect(renderToStaticMarkup(<Education param="university" />)).toContain("£9,790");
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Education param="nothing" />)).toContain('id="edu-tab-overview" aria-selected="true"');
  });
});

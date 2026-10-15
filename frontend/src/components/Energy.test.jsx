import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Energy from "./Energy";

describe("The net zero and energy bills page", () => {
  for (const tab of ["overview", "emissions", "power", "bills", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Energy param={tab} />);
      expect(html).toContain(">Net zero and energy bills<");
      expect(html).toContain(`id="ne-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object|Infinity/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("has the short version, the goals and the main tools", () => {
    expect(renderToStaticMarkup(<Energy param="overview" />)).toContain("The short version");
    expect(renderToStaticMarkup(<Energy param="overview" />)).toContain("Where the UK stands against its goals");
    const emissions = renderToStaticMarkup(<Energy param="emissions" />);
    for (const t of ["How emissions have changed", "Is the UK on course?", "Carbon budgets", "Where emissions are highest", "How the UK compares"]) expect(emissions).toContain(t);
    const power = renderToStaticMarkup(<Energy param="power" />);
    for (const t of ["Where our electricity comes from", "The 2030 goal"]) expect(power).toContain(t);
    const bills = renderToStaticMarkup(<Energy param="bills" />);
    for (const t of ["What the price cap is made of", "Where you live and how much you use", "Fuel poverty in England"]) expect(bills).toContain(t);
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Energy param="nothing" />)).toContain('id="ne-tab-overview" aria-selected="true"');
  });
});

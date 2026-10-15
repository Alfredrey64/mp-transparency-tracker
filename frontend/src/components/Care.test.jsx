import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Care from "./Care";

describe("The social care and childcare page", () => {
  for (const tab of ["overview", "adult", "workers", "childcare", "arguments", "about"]) {
    it(`opens the ${tab} toggle with a heading, text and sources`, () => {
      const html = renderToStaticMarkup(<Care param={tab} />);
      expect(html).toContain(">Social care and childcare<");
      expect(html).toContain(`id="co-tab-${tab}" aria-selected="true"`);
      expect(html).not.toMatch(/\bNaN\b|undefined|\[object|Infinity/);
      expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/—|–|→/);
      expect(html).toContain("Source");
    });
  }
  it("has the short version and the main tools", () => {
    expect(renderToStaticMarkup(<Care param="overview" />)).toContain("The short version");
    const adult = renderToStaticMarkup(<Care param="adult" />);
    for (const t of ["What councils spend", "Who pays", "Who gets help", "Where it differs", "Carers"]) expect(adult).toContain(t);
    const workers = renderToStaticMarkup(<Care param="workers" />);
    for (const t of ["Who provides the care", "Vacancies, leavers and pay", "How many more will be needed"]) expect(workers).toContain(t);
    const child = renderToStaticMarkup(<Care param="childcare" />);
    for (const t of ["Funded early education and childcare", "Where take-up is highest", "What parents say"]) expect(child).toContain(t);
  });
  it("opens at the overview for an unknown toggle", () => {
    expect(renderToStaticMarkup(<Care param="nothing" />)).toContain('id="co-tab-overview" aria-selected="true"');
  });
});

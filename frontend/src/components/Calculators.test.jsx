import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Calculators from "./Calculators";
import { BILL_STEPS, STEP_ORDER_SHUFFLE } from "../data/teacherMode";

const plain = (html) => html.replace(/<[^>]+>/g, " ");

describe("Money calculators", () => {
  it("opens on take-home pay with a worked example", () => {
    const html = renderToStaticMarkup(<Calculators />);
    expect(html).toContain(">Money calculators<");
    expect(html).toContain('id="calc-tab-pay" aria-selected="true"');
    expect(plain(html)).toContain("£35,000");
    expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
    expect(plain(html)).not.toMatch(/—|–|→/);
  });
  it("opens the stamp duty toggle with the answer for a £350,000 main home", () => {
    const html = renderToStaticMarkup(<Calculators param="stamp" />);
    expect(html).toContain('id="calc-tab-stamp" aria-selected="true"');
    // 2% of the £125,000 from £125,000 to £250,000, plus 5% of the £100,000 above it.
    expect(plain(html)).toContain("£7,500");
    expect(html).not.toMatch(/\bNaN\b|undefined|\[object/);
  });
  it("names the official sources", () => {
    expect(renderToStaticMarkup(<Calculators />)).toContain("gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027");
    expect(renderToStaticMarkup(<Calculators param="stamp" />)).toContain("gov.uk/stamp-duty-land-tax/residential-property-rates");
  });
});

describe("the law-in-order sheet", () => {
  it("shuffles every step exactly once, and not into the right order", () => {
    expect([...STEP_ORDER_SHUFFLE].sort()).toEqual(BILL_STEPS.map((_, i) => i));
    expect(STEP_ORDER_SHUFFLE).not.toEqual(BILL_STEPS.map((_, i) => i));
  });
});

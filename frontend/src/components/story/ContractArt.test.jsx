import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContractRoute, LaneOdds } from "./ContractArt";

describe("contract pictures", () => {
  it("the route picture names itself once, hides its phone twin, and draws no moving parts before it has been seen", () => {
    const html = renderToStaticMarkup(<ContractRoute />);
    expect(html.match(/role="img"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-label="[^"]*emergency shortcut/i);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
    expect(html).not.toContain("animateMotion");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });
  it("the lane picture carries the real figures, with a part-filled dot in each lane", () => {
    const html = renderToStaticMarkup(<LaneOdds />);
    expect(html).toMatch(/47 of 493[^"]*104 of 14,892/);
    expect(html.match(/class="lo-win"/g)).toHaveLength(2 * (10 + 1));
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });
});

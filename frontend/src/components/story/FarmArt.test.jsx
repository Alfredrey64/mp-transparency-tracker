import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Farming from "../explainers/farming";

describe("the Farming and food page", () => {
  const html = renderToStaticMarkup(<Farming />);
  it("keeps its figures and gives every picture a spoken description", () => {
    for (const fact of ["212,000", "£15.9bn", "446,200", "£162.3bn", "105%", "£166,300", "£2.5m", "19.1%"]) expect(html).toContain(fact);
    const imgs = html.match(/role="img"[^>]*aria-label="[^"]+"/g) ?? [];
    expect(imgs.length).toBeGreaterThanOrEqual(8);
    expect(html).toContain("The UK&#x27;s land as a hundred squares: 69 are farmed and 31 are not");
  });
  it("draws the heading scene, hidden from screen readers", () => {
    expect(html).toMatch(/class="fm-scene" aria-hidden="true"/);
  });
  it("lists every source the page had", () => {
    expect(html.match(/<li><a href="https:/g)?.length).toBe(6);
  });
});

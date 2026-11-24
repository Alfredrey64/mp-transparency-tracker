import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Loading from "./Loading";

describe("Loading", () => {
  it("a whole page is drawn as tiles and lines, keeps its place, and says nothing extra at first", () => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html).toContain("loading-page");
    expect(html).toContain("loading-tiles");
    expect(html).toContain("Loading…");
    expect(html).not.toContain('data-on="1"');
    expect(html).not.toContain("Try again");
  });

  it("a box inside a page stays a few quiet lines", () => {
    const html = renderToStaticMarkup(<Loading compact />);
    expect(html).not.toContain("loading-tiles");
    expect(html).not.toContain("loading-slow");
    expect(html).toContain("loading-bars");
  });
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Funding from "./Funding";

describe("Funding and independence page", () => {
  it("says who runs it, the rules, and shows an empty funding log", () => {
    const html = renderToStaticMarkup(<Funding onNavigate={() => {}} />);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(html).toContain(">Funding and independence<");
    expect(text).toContain("Who runs it");
    expect(text).toContain("Funding log");
    expect(text).toContain("Nothing yet.");
    expect(text).not.toMatch(/\bNaN\b|undefined|\[object/);
    expect(text).not.toMatch(/—|–|→/);
  });
});

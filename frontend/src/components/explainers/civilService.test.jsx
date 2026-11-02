import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CivilService from "./civilService";

describe("The Civil Service page", () => {
  const html = renderToStaticMarkup(<CivilService />);
  const text = html.replace(/<[^>]+>/g, " ");

  it("keeps its figures and shows the change-of-government diagram and workforce charts", () => {
    for (const s of ["557,825", "67.8%", "£37,820", "42,855", "37,945", "54.7%"]) expect(text).toContain(s);
    expect(html).toContain("cs-flip");
    expect(html).toContain("cs-work");
    for (const s of ["Ministers", "Special advisers", "Civil servants", "The government changes"]) expect(text).toContain(s);
  });

  it("is plain text throughout", () => {
    expect(text).not.toMatch(/\bNaN\b|undefined|\[object/);
    expect(text).not.toMatch(/—|–|→/);
  });
});

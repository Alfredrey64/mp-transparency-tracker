import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import About from "./About";
import Corrections from "./Corrections";
import { CONTACT_EMAIL } from "../lib/contact";

const textOf = (html) => html.replace(/<[^>]+>/g, " ");

describe("About page", () => {
  it("names who runs the site, says how it is paid for and gives the public contact address", () => {
    const html = renderToStaticMarkup(<About onNavigate={() => {}} />);
    const text = textOf(html);
    expect(html).toContain(">About Domesday Live<");
    expect(text).toContain("Alfred Reynolds");
    expect(text).toContain("no outside money");
    expect(html).toContain(`href="mailto:${CONTACT_EMAIL}"`);
    expect(text).not.toMatch(/\bNaN\b|undefined|\[object/);
    expect(text).not.toMatch(/—|–|→/);
  });
});

describe("Corrections and contact page", () => {
  it("shows the contact address, how to report a mistake and an empty corrections log", () => {
    const html = renderToStaticMarkup(<Corrections onNavigate={() => {}} />);
    const text = textOf(html);
    expect(html).toContain(">Corrections and contact<");
    expect(text).toContain(CONTACT_EMAIL);
    expect(text).toContain("Report a mistake");
    expect(text).toContain("Corrections log");
    expect(text).toContain("None yet.");
    expect(text).not.toMatch(/\bNaN\b|undefined|\[object/);
    expect(text).not.toMatch(/—|–|→/);
  });

  it("never shows a personal address", () => {
    const text = textOf(renderToStaticMarkup(<Corrections onNavigate={() => {}} />)) + textOf(renderToStaticMarkup(<About onNavigate={() => {}} />));
    expect(text).not.toMatch(/gmail\.com/i);
  });
});

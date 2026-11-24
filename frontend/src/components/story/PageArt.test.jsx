import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ChamberRoles from "./ChamberRoles";
import ChainArt from "./ChainArt";
import LawArt from "./LawArt";
import { WhoHeadlines, GenderRings, SchoolRibbon } from "./WhoArt";
import ActsSection from "../ActsSection";
import ACTS from "../../data/acts.json";

const Icon = () => <svg />;

describe("the pictures at the tops of pages", () => {
  it("the Chamber plan has a pressable card for each group, the first one lit, and a plan of 2 x 28 seats", () => {
    const roles = [
      { key: "speaker", icon: Icon, title: "The Speaker", text: "a", badge: "x", colour: "#A9701F" },
      { key: "whips", icon: Icon, title: "The whips", text: "b", badge: "y", colour: "#2C5F9E" },
    ];
    const html = renderToStaticMarkup(<ChamberRoles roles={roles} />);
    expect(html).toContain('data-role="speaker"');
    expect((html.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((html.match(/aria-pressed="false"/g) ?? []).length).toBe(1);
    expect((html.match(/swr-dot/g) ?? []).length).toBe(2 * 27);
    expect(html).toContain("Government side");
  });

  it("a chain draws one station for each step, with the words it was given", () => {
    const nodes = [{ icon: Icon, title: "First", text: "one", colour: "#123456" }, { icon: Icon, title: "Second", text: "two", colour: "#654321" }];
    const html = renderToStaticMarkup(<ChainArt kind="news" nodes={nodes} label="steps" />);
    expect(html).toContain("First");
    expect(html).toContain("Second");
    expect((html.match(/cha-pk/g) ?? []).length).toBe(6);
    expect(renderToStaticMarkup(<ChainArt kind="civil" nodes={nodes} label="steps" />)).toContain("Still here");
  });

  it("the bill picture says what it shows and ends on Royal Assent", () => {
    const html = renderToStaticMarkup(<LawArt />);
    expect(html).toContain("Royal");
    expect(html).toContain("House of Lords");
    expect(html).toContain("Royal Assent");
  });

  it("the headline figures on Who they are keep their wording, with 650 seats drawn and 267 of them lit", () => {
    const items = [{ label: "Women", value: "41%", sub: "267 women" }, { label: "Private", value: "23%", sub: "s" }, { label: "Ethnic", value: "90", sub: "t" }];
    const html = renderToStaticMarkup(<WhoHeadlines items={items} />);
    expect((html.match(/wta-seat/g) ?? []).length).toBe(650);
    expect((html.match(/wta-seat wta-on/g) ?? []).length).toBe(267);
    expect((html.match(/wta-per/g) ?? []).length).toBe(7);
    expect(html).toContain("267 women");
  });

  it("the rings and ribbon print every figure they are given", () => {
    const items = [{ label: "Labour", value: 46.8, text: "189 of 404", colour: "#C13A4E" }, { label: "Lords", value: 35.4, text: "289 of 816", colour: "#6E4B6E" }];
    const rings = renderToStaticMarkup(<GenderRings items={items} note="Note" />);
    expect(rings).toContain("189 of 404");
    expect(rings).toContain("Note");
    const rib = renderToStaticMarkup(<SchoolRibbon items={[{ label: "State", value: 63, text: "63%", colour: "#3F7D5C" }]} />);
    expect(rib).toContain("63%");
  });

  it("the Acts section carries the year's figures from the data file", () => {
    const html = renderToStaticMarkup(<ActsSection />);
    expect(html).toContain(`The Acts that have become law in ${ACTS.year}`);
    expect(html).toContain(`${ACTS.thisYear.length}`);
  });
});

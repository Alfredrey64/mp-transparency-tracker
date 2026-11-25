import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ChamberRoles from "./ChamberRoles";
import ChainArt from "./ChainArt";
import LawRoute from "./LawRoute";
import PingPong from "./PingPong";
import { StoryFunnel, StatsLenses } from "./ExplainArt";
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

  it("the route map has a stop for each stage, the words it was given, and the real date where there is one", () => {
    const stops = [
      { key: "a", band: "Commons", colour: "#2F7D52", top: "1st", bottom: "reading", title: "Commons: First reading", text: "A formality.", real: "13 November 2024" },
      { key: "b", band: "Lords", colour: "#A8323E", top: "1st", bottom: "reading", title: "Lords: First reading", text: "Another formality.", real: null },
      { key: "c", band: "Assent", colour: "#B8862B", top: "Royal", bottom: "Assent", title: "Royal Assent", text: "The King agrees.", real: "3 April 2025" },
    ];
    const html = renderToStaticMarkup(<LawRoute stops={stops} caption="Press a stop." />);
    expect((html.match(/lwr-st"/g) ?? []).length).toBe(3);
    expect(html).toContain("A formality.");
    expect(html).toContain("13 November 2024");
    expect(html).toContain("House of Commons");
    expect(html).toContain("Press a stop.");
    expect(html).toContain('aria-current="step"');
  });

  it("the ping pong rally names every landing and ends on the seal", () => {
    const html = renderToStaticMarkup(<PingPong start={{ house: "Lords", label: "3rd reading", short: "24 Mar", long: "24 March 2025" }} rounds={[{ house: "Commons", label: "Considers Lords’ changes", short: "25 Mar", long: "25 March 2025" }, { house: "Lords", label: "Considers Commons’ changes", short: "26 Mar", long: "26 March 2025" }]} end={{ short: "3 Apr", long: "3 April 2025" }} />);
    expect(html).toContain("25 Mar");
    expect(html).toContain("26 Mar");
    expect(html).toContain("3 Apr");
    expect(html).toContain("Royal");
    expect(html).toContain("2 times");
  });

  it("the story funnel and the statistics lenses print the words they are given", () => {
    const nodes = [{ icon: Icon, title: "Share of what?", text: "A share depends on the whole", colour: "#111111" }, { icon: Icon, title: "Which average?", text: "Mean or middle", colour: "#222222" }, { icon: Icon, title: "Starting where?", text: "The axis", colour: "#333333" }];
    const funnel = renderToStaticMarkup(<StoryFunnel nodes={nodes} label="How a story travels" />);
    expect(funnel).toContain("Which average?");
    // one story is followed through the funnel (one moving dot), and the others stay where they are
    expect((funnel.match(/class="nfn-dot"/g) ?? []).length).toBe(1);
    const resting = (funnel.match(/class="nfn-rest"/g) ?? []).length;
    expect(resting).toBeGreaterThanOrEqual(15);
    expect(funnel).toContain(`>${resting + 1}</text>`);
    const lenses = renderToStaticMarkup(<StatsLenses nodes={nodes} label="Three choices" />);
    expect(lenses).toContain("Starting where?");
    expect(lenses).toContain("a large share");
    expect(lenses).toContain("the mean");
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
    // every Act is a dot you can press, with a name for a screen reader
    expect((html.match(/acp-dot/g) ?? []).length).toBeGreaterThanOrEqual(ACTS.thisYear.length);
    expect(html).toContain("Show what it does");
  });
});

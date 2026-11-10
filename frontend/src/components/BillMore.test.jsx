import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import BillMore from "./BillMore";
import VoteHistory from "./VoteHistory";

const several = { short_title: "Glue Traps Bill", long_title: "A Bill to ban glue traps; to require licences; and for connected purposes" };
const single = { short_title: "Rail Bill", long_title: "A Bill to make provision about railways; and for connected purposes" };

describe("BillMore, the 'What it proposes' button", () => {
  it("starts shut: a button, and none of the points", () => {
    const html = renderToStaticMarkup(<BillMore bill={several} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("What it proposes");
    expect(html).not.toContain("point by point");
  });
  it("shows the points and the official wording straight away when asked to (a box already open)", () => {
    const html = renderToStaticMarkup(<BillMore bill={several} bare />);
    expect(html).toContain("What it proposes, point by point");
    expect(html).toContain("Bans glue traps");
    expect(html).toContain("Requires licences");
    expect(html).toContain("Official wording: A Bill to ban glue traps");
    expect(html).not.toContain("<button");
  });
  it("renders nothing when a single clause would only repeat the summary", () => {
    expect(renderToStaticMarkup(<BillMore bill={single} />)).toBe("");
    expect(renderToStaticMarkup(<BillMore bill={null} />)).toBe("");
  });
});

describe("an MP's voting history", () => {
  const votes = [{ id: 1, title: "Glue Traps Bill: Third Reading", date: "2026-10-05", aye: true, voted_aye: true, voted_with_party_majority: true }];
  it("puts the button under the bill's summary", () => {
    const html = renderToStaticMarkup(<VoteHistory votes={votes} bills={[{ ...several, current_stage: "Committee stage", current_house: "Commons" }]} hasPartyMajorityConcept />);
    expect(html).toContain("What it proposes");
    expect(html).toContain("Bans glue traps");
  });
});

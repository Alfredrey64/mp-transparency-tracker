import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PartyChangeNote from "./PartyChangeNote";
import { partyChange } from "../lib/partyChange";
import data from "../data/constituencies.json";

describe("party change note", () => {
  it("says where an MP was elected and where they sit now, with the checked account if there is one", () => {
    const html = renderToStaticMarkup(<PartyChangeNote change={partyChange(data.constituencies["fareham and waterlooville"])} />);
    expect(html).toContain('role="note"');
    expect(html).toContain("Changed party since the election.");
    expect(html).toContain("Suella Braverman was elected for Conservative at the 2024 general election and now sits for Reform UK.");
    expect(html).toContain("She left the Conservatives and joined Reform UK on 26 January 2026.");
  });
  it("is nothing for a seat whose MP has not changed party", () => {
    expect(renderToStaticMarkup(<PartyChangeNote change={partyChange(data.constituencies["holborn and st pancras"])} />)).toBe("");
  });
});

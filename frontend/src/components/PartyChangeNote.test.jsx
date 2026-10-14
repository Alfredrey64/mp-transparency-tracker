import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PartyChangeNote from "./PartyChangeNote";
import { partyChange } from "../lib/partyChange";
import data from "../data/constituencies.json";

describe("party change note", () => {
  it("says where an MP was elected and where they sit now, with the checked account if there is one", () => {
    const html = renderToStaticMarkup(<PartyChangeNote change={partyChange(data.constituencies["kingston upon hull east"])} />);
    expect(html).toContain('role="note"');
    expect(html).toContain("Changed party since the election.");
    expect(html).toContain("Karl Turner was elected for Labour at the 2024 general election and now sits as an Independent.");
    expect(html).toContain("Labour suspended him on 31 March 2026.");
  });
  it("is nothing for a seat whose MP has not changed party", () => {
    expect(renderToStaticMarkup(<PartyChangeNote change={partyChange(data.constituencies["holborn and st pancras"])} />)).toBe("");
  });
});

// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import BillStages from "./BillStages";
import STAGES from "../data/billStages.json";
import AMENDMENTS from "../data/billAmendments.json";

// A bill whose stages and amendment counts are both in the saved data: the card should say how many amendments were proposed under the stage they were made at, and nowhere else.
// The card uses portals (glossary pop-ups), which the server renderer cannot do, so it is drawn into a real (jsdom) page.
function draw(el) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(el));
  const html = host.innerHTML;
  root.unmount();
  host.remove();
  return html;
}

const id = Object.keys(AMENDMENTS).find((b) => STAGES[b]);

describe("amendment counts on a bill's journey", () => {
  it.skipIf(!id)("shows the counts under a committee or report stage", () => {
    const html = draw(<BillStages bill={{ bill_id: Number(id), current_stage: "Report stage", current_house: "Commons" }} />);
    const first = Object.values(AMENDMENTS[id])[0];
    expect(html).toContain(`${first.total.toLocaleString("en-GB")} amendment`);
    expect(html).toContain("proposed");
    expect(html).toContain("Parliament does not say which amendments are the government");
  });
  it("shows nothing extra for a bill with no counts", () => {
    const html = draw(<BillStages bill={{ bill_id: Number(Object.keys(STAGES).find((b) => !AMENDMENTS[b])), current_stage: "2nd reading", current_house: "Commons" }} />);
    expect(html).not.toContain("amendments proposed");
  });
});

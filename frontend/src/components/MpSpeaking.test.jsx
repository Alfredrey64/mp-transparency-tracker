// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RecentActivityBox } from "./MpCards";
import SPEAKING from "../data/mpSpeaking.json";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const id = Object.keys(SPEAKING.members)[0];
const politician = (over) => ({ party_colour: "d50000", parliament_member_id: Number(id), recent_activity: { contributions: [{ title: "Rail Services Bill", date: "2026-07-15", section: "Commons Chamber", speechCount: 1, questionCount: 0, interventionCount: 0 }], writtenQuestions: [] }, ...over });

async function draw(el) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const text = host.textContent;
  root.unmount();
  host.remove();
  return text;
}

describe("how often an MP has spoken", () => {
  it("says how many contributions Hansard recorded and what a contribution is", async () => {
    const text = await draw(<RecentActivityBox politician={politician()} />);
    expect(text).toContain("Hansard records");
    expect(text).toContain(`${SPEAKING.members[id].count.toLocaleString("en-GB")} spoken`);
    expect(text).toContain("one turn speaking");
  });
  it("says nothing when the file has no count for them", async () => {
    expect(await draw(<RecentActivityBox politician={politician({ parliament_member_id: 99999999 })} />)).not.toContain("Hansard records");
  });
});

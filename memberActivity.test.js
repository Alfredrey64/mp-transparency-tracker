import { describe, it, expect } from "vitest";
import { plainText, clip, memberWords, hansardUrl } from "./memberActivity.js";

describe("member activity", () => {
  it("turns Parliament's HTML into plain text", () => {
    expect(plainText("<p>Hello&nbsp;<em>there</em> &amp; welcome</p><p>Second</p>")).toBe("Hello there & welcome Second");
    expect(plainText(null)).toBe("");
  });
  it("cuts a passage at a word", () => {
    expect(clip("one two three four", 12)).toBe("one two…");
    expect(clip("short", 12)).toBe("short");
  });
  it("picks out what one member said, longest first, skipping interjections", () => {
    const debate = { Items: [
      { ItemType: "Contribution", MemberId: 7, Value: "<p>Hear, hear.</p>" },
      { ItemType: "Contribution", MemberId: 7, Value: "<p>" + "I rise to speak about the bill and what it means for my constituents in the north. ".repeat(3) + "</p>" },
      { ItemType: "Contribution", MemberId: 9, Value: "<p>Someone else entirely, speaking for a long time about other matters in the debate today.</p>" },
      { ItemType: "Contribution", MemberId: 7, Value: "<p>The minister has not answered the question that I asked earlier in this debate, so I ask again.</p>" },
    ] };
    const words = memberWords(debate, 7, { limit: 2, max: 100 });
    expect(words).toHaveLength(2);
    expect(words[0].length).toBeLessThanOrEqual(100);
    expect(words.join(" ")).not.toMatch(/Hear, hear|Someone else/);
    expect(memberWords({ Items: [{ ItemType: "Contribution", MemberId: 7, Value: "Hear, hear." }] }, 7)).toEqual(["Hear, hear."]);
    expect(memberWords(null, 7)).toEqual([]);
  });
  it("still builds the Hansard link", () => {
    expect(hansardUrl("Commons", "2026-07-15T00:00:00", "ABC", "Engage ments!")).toBe("https://hansard.parliament.uk/Commons/2026-07-15/debates/ABC/Engagements");
  });
});

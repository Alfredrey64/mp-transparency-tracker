import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RecentActivityBox } from "./MpCards";

const politician = {
  party_colour: "d50000",
  recent_activity: {
    contributions: [{ title: "Rail Services Bill", date: "2026-07-15", section: "Commons Chamber", speechCount: 2, questionCount: 0, interventionCount: 1, hansardUrl: "https://hansard.parliament.uk/Commons/2026-07-15/debates/ABC/Rail", said: ["I rise to speak about the bill."] }],
    writtenQuestions: [
      { heading: "Rail: Chorley", questionText: "To ask the Secretary of State, what plans?", uin: "12345", department: "Department for Transport", dateTabled: "2026-07-01", dateAnswered: "2026-07-06", answerText: "The Government will set out plans." },
      { heading: "Old one", questionText: "Why?", department: "DfE", dateTabled: "2026-06-01", dateAnswered: null },
    ],
  },
};

describe("what an MP has done lately", () => {
  const html = renderToStaticMarkup(<RecentActivityBox politician={politician} onNavigate={() => {}} />);
  it("links each debate to its Hansard transcript and shows what they said", () => {
    expect(html).toContain('href="https://hansard.parliament.uk/Commons/2026-07-15/debates/ABC/Rail"');
    expect(html).toContain("I rise to speak about the bill.");
    expect(html).toContain("Read the whole debate on Hansard");
  });
  it("links each written question to its own page on Parliament's site, with the answer", () => {
    expect(html).toContain('href="https://questions-statements.parliament.uk/written-questions/detail/2026-07-01/12345"');
    expect(html).toContain("The Government will set out plans.");
    expect(html).toContain("awaiting an answer");
  });
  it("does not invent a link for a question that has no reference yet", () => {
    expect(html.match(/questions-statements\.parliament\.uk/g)).toHaveLength(1);
  });
  it("shows nothing when there is no activity", () => {
    expect(renderToStaticMarkup(<RecentActivityBox politician={{ recent_activity: { contributions: [], writtenQuestions: [] } }} />)).toBe("");
  });
});

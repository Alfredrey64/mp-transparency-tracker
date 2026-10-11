import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Breakdown } from "./PartyMatch";
import { QUIZ_PARTIES, QUESTIONS } from "../data/partyMatchQuiz";

const party = QUIZ_PARTIES.find((p) => p.key === "green");

describe("quiz breakdown", () => {
  it("shows where you agree and differ, with a link to what the parties said", () => {
    // Agree with every statement the Greens take a view on, then disagree with the tax one.
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.positions.green]));
    const tax = QUESTIONS.find((q) => q.id === "tax");
    answers.tax = -2;
    const html = renderToStaticMarkup(<Breakdown party={party} answers={answers} />);
    expect(html).toContain("Why Green Party?");
    expect(html).toContain("Where you agree");
    expect(html).toContain("Where you differ");
    expect(html).toContain(tax.statement.slice(0, 40));
    expect(html).toContain("#/answers/where-does-tax-go");
    expect(html).toContain("What the parties said");
  });
  it("says so when nothing stands out", () => {
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, 0]));
    const html = renderToStaticMarkup(<Breakdown party={party} answers={answers} />);
    expect(html).toContain("somewhere in the middle");
  });
  it("shows nothing before any question is answered", () => {
    expect(renderToStaticMarkup(<Breakdown party={party} answers={{}} />)).toBe("");
  });
});

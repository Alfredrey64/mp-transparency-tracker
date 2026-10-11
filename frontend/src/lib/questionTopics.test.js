import { describe, expect, it } from "vitest";
import { groupByTopic } from "./questionTopics";
import { ANSWERS, ANSWER_TOPICS } from "../data/answers";
import { ANSWER_POSITIONS } from "../data/answerPartyPositions";

describe("groupByTopic", () => {
  it("keeps topic order, keeps question order within a topic and drops empty topics", () => {
    const qs = [{ id: "a", topic: "B" }, { id: "b", topic: "A" }, { id: "c", topic: "B" }];
    expect(groupByTopic(qs, ["A", "B", "C"]).map((g) => [g.topic, g.items.map((i) => i.id)])).toEqual([["A", ["b"]], ["B", ["a", "c"]]]);
  });

  it("places every question that has party positions under exactly one topic", () => {
    const withPositions = ANSWERS.filter((a) => ANSWER_POSITIONS[a.id]);
    const grouped = groupByTopic(withPositions, ANSWER_TOPICS);
    expect(grouped.flatMap((g) => g.items).length).toBe(withPositions.length);
  });
});

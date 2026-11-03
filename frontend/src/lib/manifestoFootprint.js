import { ANSWER_POSITIONS, POSITION_PARTY_ORDER } from "../data/answerPartyPositions";
import { ANSWERS, ANSWER_TOPICS } from "../data/answers";

// For each topic, how many of the site's questions each party made a clear promise on, read straight from the party positions behind "Who promises what".
// A party counted here made a clear commitment we are confident about; a party left out may still have a view, which the page says wherever it is shown.
export function manifestoFootprint() {
  const topicOf = new Map(ANSWERS.map((a) => [a.id, a.topic]));
  const ids = Object.keys(ANSWER_POSITIONS);
  const topics = ANSWER_TOPICS
    .map((topic) => {
      const inTopic = ids.filter((id) => topicOf.get(id) === topic);
      return {
        topic,
        total: inTopic.length,
        cells: POSITION_PARTY_ORDER.map((key) => ({ key, n: inTopic.filter((id) => ANSWER_POSITIONS[id].parties[key]).length })),
      };
    })
    .filter((t) => t.total > 0);
  const totals = POSITION_PARTY_ORDER.map((key) => ({ key, n: topics.reduce((sum, t) => sum + t.cells.find((c) => c.key === key).n, 0) }));
  return { topics, totals, questions: topics.reduce((sum, t) => sum + t.total, 0) };
}

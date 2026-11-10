import { ANSWER_POSITIONS, POSITION_PARTY_ORDER } from "../data/answerPartyPositions";
import { ANSWERS, ANSWER_TOPICS } from "../data/answers";

// Several questions can share one set of promises (for example "Where does my tax go?" and "What is National Insurance?" are answered by the same commitments), and the same
// words must not appear twice. So questions that point at the very same entry are one item here: counted once, shown once, with all their questions named.
const listOf = (items) => new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(items);

// For each topic, how many of the site's questions each party made a clear promise on, read straight from the party positions behind "Who promises what".
// A party counted here made a clear commitment we are confident about; a party left out may still have a view, which the page says wherever it is shown.
export function manifestoFootprint() {
  const topicOf = new Map(ANSWERS.map((a) => [a.id, a.topic]));
  const questionOf = new Map(ANSWERS.map((a) => [a.id, a.question]));
  const ids = Object.keys(ANSWER_POSITIONS);
  const topics = ANSWER_TOPICS
    .map((topic) => {
      // One slot per distinct entry in this topic, holding every question that uses it.
      const slots = [];
      for (const id of ids.filter((x) => topicOf.get(x) === topic)) {
        const entry = ANSWER_POSITIONS[id];
        const slot = slots.find((x) => x.entry === entry);
        if (slot) slot.ids.push(id); else slots.push({ entry, ids: [id] });
      }
      const label = (slot) => listOf(slot.ids.map((id) => questionOf.get(id)));
      return {
        topic,
        total: slots.length,
        cells: POSITION_PARTY_ORDER.map((key) => {
          const said = slots.filter((x) => x.entry.parties[key]);
          return {
            key,
            n: said.length,
            // What the party promised on each of those questions, and the questions it has no clear promise on in our summary.
            items: said.map((x) => ({ id: x.ids[0], ids: x.ids, question: label(x), about: x.entry.about, text: x.entry.parties[key] })),
            missing: slots.filter((x) => !x.entry.parties[key]).map((x) => ({ id: x.ids[0], question: label(x) })),
          };
        }),
      };
    })
    .filter((t) => t.total > 0);
  const totals = POSITION_PARTY_ORDER.map((key) => ({ key, n: topics.reduce((sum, t) => sum + t.cells.find((c) => c.key === key).n, 0) }));
  return { topics, totals, questions: topics.reduce((sum, t) => sum + t.total, 0) };
}

// Groups questions under their topic, in the topic order, leaving out topics with nothing in them. Used to turn a long flat list of
// questions into short labelled lists that are quicker to scan.
export function groupByTopic(questions, topics) {
  return topics
    .map((topic) => ({ topic, items: questions.filter((q) => q.topic === topic) }))
    .filter((g) => g.items.length > 0);
}

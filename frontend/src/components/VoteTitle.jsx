import { explainDivision } from "../lib/divisionExplainer";

// The plain-English name for a vote, e.g. "Health Bill: Proposed new section
// (clause 142) · Report Stage". Its own small file so places that are part
// of the eagerly loaded bundle can pull it in lazily.
export default function VoteTitle({ title }) {
  return <>{explainDivision(title)?.headline ?? title}</>;
}

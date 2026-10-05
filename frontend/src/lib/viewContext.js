import { createContext } from "react";

// Which page the visitor is on, as the key its "What you're looking at" guide
// is filed under (see data/pageGuides.js). App provides it; PageHeader reads
// it, so every page's header shows its guide without each page passing it in.
export const GuideKeyContext = createContext(null);

// The guide key for a view and its address parameter.
export function guideKeyFor(view, param) {
  if (view === "numbers" && param === "lords") return "numbersLords";
  if (view === "lords" && param) return "peer";
  if (view === "list" && param && !String(param).startsWith("career=")) return "list";
  return view;
}

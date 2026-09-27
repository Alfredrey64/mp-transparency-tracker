// Maps a party manifesto section heading (from data/partyManifestos.js) onto
// the closest matching bill-category label (from lib/bills.js) — the bridge
// that lets an MP's profile show actual votes on legislation touching the
// same policy area their own party campaigned on.
//
// One heading maps to at most one category — a best-fit match, not an
// exhaustive one. Headings that combine two different policy areas (a
// party's own "Economy & Environment") or have no real legislative
// equivalent at all ("National Service", "Independence & Constitution") are
// left out on purpose rather than force-fit into a misleading match.
const SECTION_TO_BILL_CATEGORY = {
  "Economy & Tax": "Economy & Finance",
  "Tax & Economy": "Economy & Finance",
  "Economy": "Economy & Finance",
  "Health & Care": "Health",
  "Immigration & Borders": "Justice & Home Affairs",
  "Immigration": "Justice & Home Affairs",
  "Justice & Crime": "Justice & Home Affairs",
  "Energy & Environment": "Environment & Energy",
  "Energy": "Environment & Energy",
  "Environment": "Environment & Energy",
  "Education": "Education",
  "Social Security": "Work & Pensions",
};

export function manifestoSectionToBillCategory(heading) {
  return SECTION_TO_BILL_CATEGORY[heading] ?? null;
}

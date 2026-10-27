// Every English sentence the Welsh version has to cover, found by reading the source rather than by anyone remembering to list it: each t("...") call in the files
// below, plus the names, hints and blurbs that come from data. A test (cy.test.js) holds the Welsh dictionary to it, so a sentence that is added to a covered file
// without a Welsh version fails the build and a translator has an exact list to work from. Used by tests only: it reads source text, so it never ships.
import { SECTIONS, HUBS, OUTSIDE_SECTIONS_LIST } from "../data/sidebarSections";
import { MENU_GROUPS, FOOTER_LINKS, FOOTER_COLUMNS, DRAWER_FOOT } from "../data/siteMenu";
import { SIZE_LABELS } from "../lib/display";
import { BALLOT_PHRASES } from "../lib/ballots";
import { COUNCIL_PHRASES } from "../lib/compareCouncils";
import { REGIONS, metricById } from "../data/regionMetrics";
import { PAGE_GUIDES, GUIDE_ALIASES } from "../data/pageGuides";
import { WELSH_VIEWS } from "./views";
import { canIVote } from "../lib/canIVote";
import { STEPS, DEADLINES, RESULT_LABEL, AFTER_LINKS } from "../data/voteSteps";

// The component files whose every t("...") must have a Welsh version. A page's file is added here, and its key to views.js, when its Welsh is done.
export const COVERED = [
  "../components/SiteHeader.jsx", "../components/SiteFooter.jsx", "../components/SectionNav.jsx", "../components/HubTabs.jsx", "../components/PageGuide.jsx",
  "../components/shared.jsx", "../components/ShareButton.jsx", "../components/PageFoot.jsx", "../components/GlobalSearch.jsx", "../components/BackToTop.jsx",
  "../components/Loading.jsx", "../components/ErrorBoundary.jsx", "../components/AccessibilityControls.jsx", "../components/AccessibilityDialog.jsx",
  "../components/Accessibility.jsx", "../components/ReadAloud.jsx", "../App.jsx", "../components/MyBallot.jsx", "../components/CompareCouncils.jsx", "../components/HowToVote.jsx",
];

// Reads the first argument of every t("...") call in a file's source. Calls that are not a plain string (t(label), t(`...`)) are the data's job, below.
export function literalKeys(source) {
  const out = [];
  const re = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(source))) {
    try { out.push(JSON.parse(`"${m[1]}"`)); } catch { out.push(m[1]); }
  }
  return out;
}

const labelsOf = (items) => items.flatMap((i) => [i.label, i.hint].filter(Boolean));

// Everything that comes from data and is shown through t(): the menus, the page groups, the footer, the text sizes, and the plain-English phrases built from API fields.
export function dataKeys() {
  const keys = new Set();
  const add = (...xs) => xs.flat().filter(Boolean).forEach((x) => keys.add(x));
  for (const s of SECTIONS) { add(s.label, s.blurb); add(labelsOf(s.items)); }
  for (const h of HUBS) { add(h.label, h.hint); add(h.pages.map(([, label]) => label)); }
  add(MENU_GROUPS.map((m) => m.label));
  add(FOOTER_LINKS.map((l) => l.label));
  for (const c of FOOTER_COLUMNS) { add(c.title); add(c.links.map(([, label]) => label)); }
  add(DRAWER_FOOT.map(([, label]) => label));
  add(SIZE_LABELS);
  add(OUTSIDE_SECTIONS_LIST);
  // Words a component takes as a default or a prop, so no t("...") for them appears in its source.
  add(["Share", "Your say", "UK Parliament", "About this site"]);
  add(BALLOT_PHRASES);
  add(COUNCIL_PHRASES);
  // The regions, and the labels of the four regional figures shown beside a council.
  add(REGIONS.map((r) => r.name));
  add(["pay", "price", "unemployment", "employment"].map((id) => metricById(id)?.label));
  // How to vote: the steps, deadlines and answers, and every label and note the "Can I vote?" checker can give, for every combination of answers.
  for (const st of STEPS) { add(st.title, st.short, st.unit, st.line); if (!/^\d+$/.test(st.fact)) add(st.fact); }
  add(DEADLINES.map((d) => d.label));
  add(Object.values(RESULT_LABEL));
  add(AFTER_LINKS.map(([, label]) => label));
  for (const age of ["adult", "teen", "child"]) for (const nation of ["england", "scotland", "wales", "ni"]) for (const citizenship of ["british-irish", "commonwealth", "eu", "other"]) {
    for (const row of canIVote({ age, nation, citizenship })) add(row.label, row.note);
  }
  // The "what you're looking at" lines of every page that has a Welsh version.
  for (const view of WELSH_VIEWS) {
    const g = PAGE_GUIDES[GUIDE_ALIASES[view] ?? view];
    if (g) add(g.what, g.why, g.notShown);
  }
  return keys;
}

// The sentences a covered file's own t("...") calls name, with the files they are in.
export function sourceKeys(sources) {
  const found = new Map();
  for (const [path, text] of Object.entries(sources)) for (const k of literalKeys(text)) found.set(k, [...(found.get(k) ?? []), path.split("/").pop()]);
  return found;
}
